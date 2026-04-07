package com.ecommerce.order.resource;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

/**
 * Integration tests for OrderResource REST endpoints.
 * Tests run against a real Quarkus instance with H2/PostgreSQL testcontainer.
 */
@QuarkusTest
class OrderResourceIT {

    /**
     * Unauthenticated request → 401
     */
    @Test
    void createOrder_withoutToken_returns401() {
        given()
            .contentType(ContentType.JSON)
            .body("""
                {"shippingAddress": "Hanoi, Vietnam"}
                """)
        .when()
            .post("/api/orders")
        .then()
            .statusCode(401);
    }

    /**
     * Unauthenticated GET → 401
     */
    @Test
    void getOrders_withoutToken_returns401() {
        given()
        .when()
            .get("/api/orders")
        .then()
            .statusCode(401);
    }

    /**
     * Health endpoint should always be accessible
     */
    @Test
    void health_returns200() {
        given()
        .when()
            .get("/q/health")
        .then()
            .statusCode(200)
            .body("status", equalTo("UP"));
    }
}
