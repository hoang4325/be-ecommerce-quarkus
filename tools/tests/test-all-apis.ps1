# -----------------------------------------------------------------
# E2E API AUTOMATION TEST SCRIPT
# -----------------------------------------------------------------

$adminEmail = "admin@ecommerce.com"
$adminPassword = "admin123"

Write-Host "========================================="
Write-Host "       E2E API AUTOMATION TEST           "
Write-Host "========================================="

# [1] LOGIN
Write-Host "`n[1] Fetching Token via Login API ($adminEmail)..."
$loginBody = @{
    email = $adminEmail
    password = $adminPassword
} | ConvertTo-Json

try {
    $loginRes = Invoke-RestMethod -Method Post -Uri "http://localhost:8082/api/auth/login" -ContentType "application/json" -Body $loginBody
    $token = $loginRes.data.access_token
    if (-not $token) { throw "Token is empty" }
    Write-Host " -> OK. Token retrieved!"
} catch {
    Write-Host " -> FAIL: Step 1 Failed. Error: $_" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $respBody = $reader.ReadToEnd()
        Write-Host " -> Server Response: $respBody" -ForegroundColor Red
    }
    exit 1
}

$headers = @{ Authorization = "Bearer $token" }

# [2] ME
Write-Host "`n[2] Fetching User Info (/api/auth/me)..."
try {
    $meRes = Invoke-RestMethod -Method Get -Uri "http://localhost:8082/api/auth/me" -Headers $headers
    Write-Host " -> Welcome, $($meRes.data.firstName) $($meRes.data.lastName) (ID: $($meRes.data.id))"
} catch {
    Write-Host " -> FAIL: Step 2 Failed. Error: $_" -ForegroundColor Red
    exit 1
}

# [3] CREATE PRODUCT
Write-Host "`n[3] Creating a Product (/api/products)..."
$rand = Get-Random -Maximum 9999
$prodBody = @{
    name = "E2E iPhone 16 Pro Max $rand"
    slug = "iphone-16-pro-max-$rand"
    description = "Test E2E"
    price = 1199.99
    imageUrl = "http://example.com/ip16.png"
} | ConvertTo-Json

try {
    $prodRes = Invoke-RestMethod -Method Post -Uri "http://localhost:8083/api/products" -Headers $headers -ContentType "application/json" -Body $prodBody
    $productId = $prodRes.data.id
    Write-Host " -> OK. Product ID: $productId"
} catch {
    Write-Host " -> FAIL: Step 3 Failed. Error: $_" -ForegroundColor Red
    exit 1
}

# [4] INVENTORY
Write-Host "`n[4] Adding Stock to Inventory (/api/inventory)..."
$invBody = @{
    productId = $productId
    productName = "E2E iPhone 16 Pro Max $rand"
    quantity = 50
} | ConvertTo-Json

try {
    Invoke-RestMethod -Method Post -Uri "http://localhost:8087/api/inventory" -Headers $headers -ContentType "application/json" -Body $invBody
    Write-Host " -> OK. Stock added to Inventory."
} catch {
    Write-Host " -> FAIL: Step 4 Failed. Error: $_" -ForegroundColor Red
    exit 1
}

# [5] CART
Write-Host "`n[5] Adding Item to Cart (/api/cart/items)..."
$cartBody = @{
    productId = $productId
    quantity = 2
} | ConvertTo-Json

try {
    Invoke-RestMethod -Method Post -Uri "http://localhost:8084/api/cart/items" -Headers $headers -ContentType "application/json" -Body $cartBody
    Write-Host " -> OK. Added to Cart."
} catch {
    Write-Host " -> FAIL: Step 5 Failed. Error: $_" -ForegroundColor Red
    exit 1
}

# [6] CHECKOUT
Write-Host "`n[6] Checking out! Creating Order (/api/orders)..."
$orderBody = @{
    shippingAddress = "Ha Noi, Vietnam"
} | ConvertTo-Json

try {
    $orderRes = Invoke-RestMethod -Method Post -Uri "http://localhost:8085/api/orders" -Headers $headers -ContentType "application/json" -Body $orderBody
    $orderId = $orderRes.data.id
    Write-Host " -> OK! Order created, Status: PENDING. ID: $orderId"
} catch {
    Write-Host " -> FAIL: Step 6 Failed. Error: $_" -ForegroundColor Red
    exit 1
}

# [7] WAIT
Write-Host "`n[7] Waiting 5 seconds for Kafka Saga to complete..."
Start-Sleep -Seconds 5

# [8] VERIFY
Write-Host "`n[8] Verifying Final Order Status..."
try {
    $verifyRes = Invoke-RestMethod -Method Get -Uri "http://localhost:8085/api/orders/$orderId" -Headers $headers
    $finalStatus = $verifyRes.data.status
    Write-Host " -> FINAL ORDER STATUS is: $finalStatus"

    if ($finalStatus -eq "CONFIRMED") {
        Write-Host "`n>>> SUCCESS! The E2E Kafka Flow works PERFECTLY! <<<" -ForegroundColor Green
    } else {
        Write-Host "`n>>> WARNING! Expected CONFIRMED, but got $finalStatus <<<" -ForegroundColor Yellow
    }
} catch {
    Write-Host " -> FAIL: Step 8 Failed. Error: $_" -ForegroundColor Red
    exit 1
}
