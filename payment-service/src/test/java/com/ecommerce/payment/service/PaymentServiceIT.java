package com.ecommerce.payment.service;

import com.ecommerce.common.event.PaymentProcessedEvent;
import com.ecommerce.common.event.StockReservedEvent;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests for PaymentService.
 */
@QuarkusTest
class PaymentServiceIT {

    @Inject PaymentService paymentService;

    @Test
    void processPayment_stockSuccess_createsPaymentRecord() {
        StockReservedEvent event = StockReservedEvent.builder()
                .orderId(UUID.randomUUID())
                .userId(UUID.randomUUID())
                .success(true)
                .totalAmount(new BigDecimal("299.99"))
                .build();

        PaymentProcessedEvent result = paymentService.processPayment(event, new BigDecimal("299.99"));

        assertTrue(result.isSuccess());
        assertEquals(new BigDecimal("299.99"), result.getAmount());
        assertNotNull(result.getTransactionId());
        assertTrue(result.getTransactionId().startsWith("TXN-"));
    }

    @Test
    void processPayment_stockFailed_skipsPayment() {
        StockReservedEvent event = StockReservedEvent.builder()
                .orderId(UUID.randomUUID())
                .userId(UUID.randomUUID())
                .success(false)
                .reason("Insufficient stock for Widget")
                .build();

        PaymentProcessedEvent result = paymentService.processPayment(event, BigDecimal.ZERO);

        assertFalse(result.isSuccess());
        assertEquals(BigDecimal.ZERO, result.getAmount());
        assertNull(result.getTransactionId());
        assertTrue(result.getReason().contains("Stock reservation failed"));
    }

    @Test
    void processPayment_setsCorrectOrderAndUserId() {
        UUID orderId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        StockReservedEvent event = StockReservedEvent.builder()
                .orderId(orderId).userId(userId).success(true)
                .totalAmount(new BigDecimal("50.00")).build();

        PaymentProcessedEvent result = paymentService.processPayment(event, new BigDecimal("50.00"));

        assertEquals(orderId, result.getOrderId());
        assertEquals(userId, result.getUserId());
    }
}
