package com.ecommerce.order.messaging;

import com.ecommerce.common.event.StockReservedEvent;
import com.ecommerce.order.service.OrderService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.reactive.messaging.Incoming;
import org.jboss.logging.Logger;

import io.smallrye.reactive.messaging.annotations.Blocking;

/**
 * Kafka consumer: listens for stock-reserved events.
 * Updates order to STOCK_RESERVED or CANCELLED.
 */
@ApplicationScoped
public class StockReservedConsumer {

    private static final Logger LOG = Logger.getLogger(StockReservedConsumer.class);

    @Inject OrderService orderService;

    @Incoming("stock-reserved-in")
    @Blocking
    public void onStockReserved(StockReservedEvent event) {
        LOG.infof("Received stock-reserved for order %s (success=%s)", event.getOrderId(), event.isSuccess());
        orderService.handleStockReserved(event.getOrderId(), event.isSuccess(), event.getReason());
    }
}
