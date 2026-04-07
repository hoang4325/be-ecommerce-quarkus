package com.ecommerce.common.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Event produced by inventory-service after stock is reserved or rejected.
 * Consumed by: payment-service (if reserved) or order-service (if rejected)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockReservedEvent {

    private UUID orderId;
    private UUID userId;
    private boolean success;
    private String reason;             // null if success, failure reason otherwise
    private BigDecimal totalAmount;    // forwarded from OrderCreatedEvent for payment
}
