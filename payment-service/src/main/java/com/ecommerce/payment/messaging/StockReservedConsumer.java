package com.ecommerce.payment.messaging;

import com.ecommerce.common.event.PaymentProcessedEvent;
import com.ecommerce.common.event.StockReservedEvent;
import com.ecommerce.payment.service.PaymentService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.reactive.messaging.Channel;
import org.eclipse.microprofile.reactive.messaging.Emitter;
import org.eclipse.microprofile.reactive.messaging.Incoming;
import org.jboss.logging.Logger;

import java.math.BigDecimal;

import io.smallrye.reactive.messaging.annotations.Blocking;

/**
 * Kafka consumer: listens for stock-reserved events.
 * If stock reserved successfully → process payment → produce payment-processed event.
 */
@ApplicationScoped
public class StockReservedConsumer {

    private static final Logger LOG = Logger.getLogger(StockReservedConsumer.class);

    @Inject PaymentService paymentService;

    @Channel("payment-processed-out")
    Emitter<PaymentProcessedEvent> paymentEmitter;

    @Incoming("stock-reserved-in")
    @Blocking
    public void onStockReserved(StockReservedEvent event) {
        LOG.infof("Received stock-reserved event for order %s (success=%s)", event.getOrderId(), event.isSuccess());

        // Use real totalAmount forwarded from OrderCreatedEvent
        BigDecimal amount = event.getTotalAmount() != null ? event.getTotalAmount() : BigDecimal.ZERO;

        PaymentProcessedEvent result = paymentService.processPayment(event, amount);
        paymentEmitter.send(result);

        LOG.infof("Produced payment-processed event for order %s (success=%s)", result.getOrderId(), result.isSuccess());
    }
}
