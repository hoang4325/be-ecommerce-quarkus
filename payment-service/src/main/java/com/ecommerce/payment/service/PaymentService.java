package com.ecommerce.payment.service;

import com.ecommerce.common.event.PaymentProcessedEvent;
import com.ecommerce.common.event.StockReservedEvent;
import com.ecommerce.payment.entity.Payment;
import com.ecommerce.payment.repository.PaymentRepository;
import io.micrometer.core.instrument.MeterRegistry;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Mock payment processor.
 * In production, this would integrate with Stripe/PayPal/etc.
 * For Phase 3 demo: always succeeds (simulates payment).
 */
@ApplicationScoped
public class PaymentService {

    private static final Logger LOG = Logger.getLogger(PaymentService.class);

    @Inject PaymentRepository paymentRepository;
    @Inject MeterRegistry meterRegistry;

    @Transactional
    public PaymentProcessedEvent processPayment(StockReservedEvent event, BigDecimal amount) {
        if (!event.isSuccess()) {
            // Stock reservation failed — no payment needed
            return PaymentProcessedEvent.builder()
                    .orderId(event.getOrderId())
                    .userId(event.getUserId())
                    .amount(BigDecimal.ZERO)
                    .success(false)
                    .reason("Stock reservation failed: " + event.getReason())
                    .build();
        }

        // Mock payment — always succeeds
        String txnId = "TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Payment payment = new Payment();
        payment.setOrderId(event.getOrderId());
        payment.setUserId(event.getUserId());
        payment.setAmount(amount);
        payment.setStatus("SUCCESS");
        payment.setTransactionId(txnId);
        paymentRepository.persist(payment);

        LOG.infof("Payment processed for order %s: txn=%s, amount=%s", event.getOrderId(), txnId, amount);
        meterRegistry.counter("payments.processed", "status", "SUCCESS").increment();

        return PaymentProcessedEvent.builder()
                .orderId(event.getOrderId())
                .userId(event.getUserId())
                .amount(amount)
                .success(true)
                .transactionId(txnId)
                .build();
    }
}
