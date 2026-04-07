package com.ecommerce.inventory.messaging;

import com.ecommerce.common.event.OrderConfirmedEvent;
import com.ecommerce.inventory.service.InventoryService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.reactive.messaging.Incoming;
import org.jboss.logging.Logger;

import io.smallrye.reactive.messaging.annotations.Blocking;

/**
 * Kafka consumer: listens for order-confirmed events.
 * - CONFIRMED → confirm reservation (deduct from actual stock)
 * - CANCELLED → release reserved stock (compensation)
 */
@ApplicationScoped
public class OrderConfirmedConsumer {

    private static final Logger LOG = Logger.getLogger(OrderConfirmedConsumer.class);

    @Inject InventoryService inventoryService;

    @Incoming("order-confirmed-in")
    @Blocking
    public void onOrderConfirmed(OrderConfirmedEvent event) {
        LOG.infof("Received order-%s for order %s", event.getStatus(), event.getOrderId());

        if ("CONFIRMED".equals(event.getStatus())) {
            inventoryService.confirmReservation(event.getOrderId());
        } else if ("CANCELLED".equals(event.getStatus())) {
            inventoryService.releaseReservedStock(event.getOrderId());
        }
    }
}
