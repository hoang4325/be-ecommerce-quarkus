# -----------------------------------------------------------------
# COMPREHENSIVE API AUTOMATION TEST SCRIPT
# -----------------------------------------------------------------

$adminEmail = "admin@ecommerce.com"
$adminPassword = "admin123"

Write-Host "========================================="
Write-Host "       COMPREHENSIVE API TEST           "
Write-Host "========================================="

# [1] AUTH SERVICE (8082)
Write-Host "`n[1] AUTH SERVICE: Fetching Token via Login API..."
$loginBody = @{
    email = "admin@ecommerce.com"
    password = "admin123"
} | ConvertTo-Json
$loginRes = Invoke-RestMethod -Method Post -Uri "http://localhost:8082/api/auth/login" -ContentType "application/json" -Body $loginBody
$token = $loginRes.data.access_token
$headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }
Write-Host " -> OK. Token retrieved!"

# [2] USER SERVICE (8090)
Write-Host "`n[2] USER SERVICE: Fetching Profile..."
$profileRes = Invoke-RestMethod -Method Get -Uri "http://localhost:8090/api/users/me" -Headers $headers
$userId = $profileRes.data.id
Write-Host " -> OK. User Profile retrieved: $($profileRes.data.firstName) $($profileRes.data.lastName)"

Write-Host " -> USER SERVICE: Updating Profile..."
$updateProfileBody = @{
    firstName = "Admin"
    lastName = "SuperUser"
    phone = "1234567890"
    address = "Hanoi, Vietnam"
} | ConvertTo-Json
$updateRes = Invoke-RestMethod -Method Put -Uri "http://localhost:8090/api/users/me" -Headers $headers -Body $updateProfileBody
Write-Host " -> OK. User Profile Updated."

# [3] PRODUCT SERVICE (8083)
Write-Host "`n[3] PRODUCT SERVICE: Creating Category..."
$catName = "Auto Category $(Get-Random)"
$catBody = @{ name = $catName; description = "Test Category" } | ConvertTo-Json
$catRes = Invoke-RestMethod -Method Post -Uri "http://localhost:8083/api/categories" -Headers $headers -Body $catBody
$catId = $catRes.data.id
Write-Host " -> OK. Category Created: $catId"

Write-Host " -> PRODUCT SERVICE: Listing Categories..."
$catList = Invoke-RestMethod -Method Get -Uri "http://localhost:8083/api/categories" -Headers $headers
Write-Host " -> OK. Total Categories: $($catList.data.Count)"

Write-Host " -> PRODUCT SERVICE: Creating Product..."
$rand = Get-Random -Maximum 9999
$prodBody = @{
    name = "Auto Product $rand"
    slug = "auto-product-$rand"
    description = "Test Product"
    price = 499.99
    categoryId = $catId
} | ConvertTo-Json
$prodRes = Invoke-RestMethod -Method Post -Uri "http://localhost:8083/api/products" -Headers $headers -Body $prodBody
$productId = $prodRes.data.id
Write-Host " -> OK. Product Created: $productId"

Write-Host " -> PRODUCT SERVICE: Listing Products..."
$prodList = Invoke-RestMethod -Method Get -Uri "http://localhost:8083/api/products?size=10" -Headers $headers
Write-Host " -> OK. Queried active products."

# [4] INVENTORY SERVICE (8087)
Write-Host "`n[4] INVENTORY SERVICE: Adding Stock..."
$invBody = @{
    productId = $productId
    productName = "Auto Product $rand"
    quantity = 100
} | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "http://localhost:8087/api/inventory" -Headers $headers -Body $invBody
Write-Host " -> OK. Stock Added."

Write-Host " -> INVENTORY SERVICE: Checking Stock..."
$checkStockRes = Invoke-RestMethod -Method Get -Uri "http://localhost:8087/api/inventory/$productId" -Headers $headers
Write-Host " -> OK. Stock available: $($checkStockRes.data.availableQuantity)"

# [5] CART SERVICE (8084)
Write-Host "`n[5] CART SERVICE: Adding Item to Cart..."
$cartAddBody = @{ productId = $productId; quantity = 2 } | ConvertTo-Json
$addCartRes = Invoke-RestMethod -Method Post -Uri "http://localhost:8084/api/cart/items" -Headers $headers -Body $cartAddBody
Write-Host " -> OK. Item added to Cart."

# Extract itemId from the cart response items list
$itemId = $addCartRes.data.items | Where-Object { $_.productId -eq $productId } | Select-Object -ExpandProperty id

if ($itemId) {
    Write-Host " -> CART SERVICE: Updating Item Quantity (itemId: $itemId)..."
    $cartUpdateBody = @{ quantity = 5 } | ConvertTo-Json
    Invoke-RestMethod -Method Put -Uri "http://localhost:8084/api/cart/items/$itemId" -Headers $headers -Body $cartUpdateBody
    Write-Host " -> OK. Cart item updated to 5 units."
}

Write-Host " -> CART SERVICE: Fetching Cart..."
$cartRes = Invoke-RestMethod -Method Get -Uri "http://localhost:8084/api/cart" -Headers $headers
Write-Host " -> OK. Cart Total Amount: $($cartRes.data.totalAmount)"

# [6] ORDER SERVICE (8085)
Write-Host "`n[6] ORDER SERVICE: Checking Out (Creating Order)..."
$orderBody = @{ shippingAddress = "Hanoi, Vietnam" } | ConvertTo-Json
$orderRes = Invoke-RestMethod -Method Post -Uri "http://localhost:8085/api/orders" -Headers $headers -Body $orderBody
$orderId = $orderRes.data.id
Write-Host " -> OK. Order Created: $orderId"

# [7] NOTIFICATION SERVICE (8089)
Write-Host "`n[7] NOTIFICATION SERVICE: Waiting 5 seconds for Saga to finish..."
Start-Sleep -Seconds 5

Write-Host " -> NOTIFICATION SERVICE: Getting Unread Notifications..."
$notiRes = Invoke-RestMethod -Method Get -Uri "http://localhost:8089/api/notifications/unread" -Headers $headers
$notiId = if ($notiRes.data -and $notiRes.data.Count -gt 0) { $notiRes.data[0].id } else { $null }
Write-Host " -> OK. Found $($notiRes.data.Count) unread notifications."

if ($notiId) {
    Write-Host " -> NOTIFICATION SERVICE: Marking single notification as read..."
    Invoke-RestMethod -Method Put -Uri "http://localhost:8089/api/notifications/$notiId/read" -Headers $headers
    Write-Host " -> OK."
}

# [8] PAYMENT SERVICE (8088)
Write-Host "`n[8] PAYMENT SERVICE: Getting Payment by Order ID..."
$paymentRes = Invoke-RestMethod -Method Get -Uri "http://localhost:8088/api/payments/order/$orderId" -Headers $headers
Write-Host " -> OK. Payment Status: $($paymentRes.data.status) | Transaction: $($paymentRes.data.transactionId)"

# [9] ORDER SERVICE - FINAL VERIFICATION
Write-Host "`n[9] ORDER SERVICE: Verifying Final Order Status..."
$orderVerify = Invoke-RestMethod -Method Get -Uri "http://localhost:8085/api/orders/$orderId" -Headers $headers
Write-Host " -> FINAL ORDER STATUS: $($orderVerify.data.status)"

# Optional: List User Orders
Write-Host " -> ORDER SERVICE: Listing My Orders..."
$myOrdersRes = Invoke-RestMethod -Method Get -Uri "http://localhost:8085/api/orders" -Headers $headers
Write-Host " -> OK. Total Orders: $($myOrdersRes.data.Count)"

Write-Host "`n>>> COMPREHENSIVE TEST COMPLETED SUCCESSFULLY! <<<" -ForegroundColor Green
