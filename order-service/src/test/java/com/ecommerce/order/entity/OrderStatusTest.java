package com.ecommerce.order.entity;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for OrderStatus state machine.
 * Validates that only legal transitions are allowed.
 */
class OrderStatusTest {

    // ─── PENDING transitions ───────────────────────────────────────────────────

    @Test
    void pending_canTransitionTo_stockReserved() {
        assertTrue(OrderStatus.PENDING.canTransitionTo(OrderStatus.STOCK_RESERVED));
    }

    @Test
    void pending_canTransitionTo_cancelled() {
        assertTrue(OrderStatus.PENDING.canTransitionTo(OrderStatus.CANCELLED));
    }

    @Test
    void pending_cannotTransitionTo_confirmed() {
        assertFalse(OrderStatus.PENDING.canTransitionTo(OrderStatus.CONFIRMED),
                "PENDING → CONFIRMED is illegal; must go through STOCK_RESERVED first");
    }

    @Test
    void pending_cannotTransitionTo_pending() {
        assertFalse(OrderStatus.PENDING.canTransitionTo(OrderStatus.PENDING));
    }

    // ─── STOCK_RESERVED transitions ────────────────────────────────────────────

    @Test
    void stockReserved_canTransitionTo_confirmed() {
        assertTrue(OrderStatus.STOCK_RESERVED.canTransitionTo(OrderStatus.CONFIRMED));
    }

    @Test
    void stockReserved_canTransitionTo_cancelled() {
        assertTrue(OrderStatus.STOCK_RESERVED.canTransitionTo(OrderStatus.CANCELLED));
    }

    @Test
    void stockReserved_cannotTransitionTo_pending() {
        assertFalse(OrderStatus.STOCK_RESERVED.canTransitionTo(OrderStatus.PENDING),
                "Cannot go backwards from STOCK_RESERVED to PENDING");
    }

    // ─── Terminal states ───────────────────────────────────────────────────────

    @ParameterizedTest
    @EnumSource(OrderStatus.class)
    void confirmed_cannotTransitionToAnything(OrderStatus target) {
        assertFalse(OrderStatus.CONFIRMED.canTransitionTo(target),
                "CONFIRMED is a terminal state — no transitions allowed");
    }

    @ParameterizedTest
    @EnumSource(OrderStatus.class)
    void cancelled_cannotTransitionToAnything(OrderStatus target) {
        assertFalse(OrderStatus.CANCELLED.canTransitionTo(target),
                "CANCELLED is a terminal state — no transitions allowed");
    }

    // ─── Order.transitionTo() guard ────────────────────────────────────────────

    @Test
    void order_transitionTo_validTransition_succeeds() {
        Order order = new Order();
        order.setStatus(OrderStatus.PENDING);
        order.transitionTo(OrderStatus.STOCK_RESERVED);
        assertEquals(OrderStatus.STOCK_RESERVED, order.getStatus());
    }

    @Test
    void order_transitionTo_invalidTransition_throwsException() {
        Order order = new Order();
        order.setStatus(OrderStatus.CONFIRMED);
        assertThrows(com.ecommerce.common.exception.BusinessException.class,
                () -> order.transitionTo(OrderStatus.CANCELLED),
                "Should throw BusinessException for invalid transition");
    }
}
