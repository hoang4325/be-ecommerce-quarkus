package com.ecommerce.order.entity;

/**
 * Order state machine with transition guards.
 *
 * <pre>
 *   PENDING ──→ STOCK_RESERVED ──→ CONFIRMED
 *     │              │
 *     ╰──→ CANCELLED ←╯
 * </pre>
 */
public enum OrderStatus {
    PENDING,          // Order created, waiting for stock reservation
    STOCK_RESERVED,   // Stock reserved, waiting for payment
    CONFIRMED,        // Payment succeeded — terminal state
    CANCELLED;        // Any failure or user cancel — terminal state

    /**
     * State machine guard — only allows valid transitions.
     */
    public boolean canTransitionTo(OrderStatus next) {
        return switch (this) {
            case PENDING -> next == STOCK_RESERVED || next == CANCELLED;
            case STOCK_RESERVED -> next == CONFIRMED || next == CANCELLED;
            case CONFIRMED, CANCELLED -> false; // terminal states
        };
    }
}
