package com.ecommerce.inventory.service;

import com.ecommerce.common.event.OrderCreatedEvent;
import com.ecommerce.common.event.StockReservedEvent;
import com.ecommerce.inventory.entity.Inventory;
import com.ecommerce.inventory.entity.StockReservation;
import com.ecommerce.inventory.repository.InventoryRepository;
import com.ecommerce.inventory.repository.StockReservationRepository;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests for InventoryService saga operations.
 */
@QuarkusTest
class InventoryServiceIT {

    @Inject InventoryService inventoryService;
    @Inject InventoryRepository inventoryRepository;
    @Inject StockReservationRepository stockReservationRepository;

    private UUID productId;
    private UUID orderId;
    private UUID userId;

    @BeforeEach
    @Transactional
    void setup() {
        // Clean up
        stockReservationRepository.deleteAll();
        inventoryRepository.deleteAll();

        // Create test inventory
        productId = UUID.randomUUID();
        orderId = UUID.randomUUID();
        userId = UUID.randomUUID();

        Inventory inv = new Inventory();
        inv.setProductId(productId);
        inv.setProductName("Test Widget");
        inv.setQuantity(100);
        inv.setReservedQuantity(0);
        inventoryRepository.persist(inv);
    }

    @Test
    void reserveStock_sufficientStock_succeeds() {
        OrderCreatedEvent event = buildOrderEvent(5);

        StockReservedEvent result = inventoryService.reserveStock(event);

        assertTrue(result.isSuccess());
        assertEquals(orderId, result.getOrderId());

        // Verify inventory updated
        Inventory inv = inventoryRepository.findByProductId(productId).orElseThrow();
        assertEquals(5, inv.getReservedQuantity());
        assertEquals(95, inv.getAvailable());

        // Verify reservation record created
        List<StockReservation> reservations = stockReservationRepository.findByOrderId(orderId);
        assertEquals(1, reservations.size());
        assertEquals("RESERVED", reservations.get(0).getStatus());
    }

    @Test
    void reserveStock_insufficientStock_fails() {
        OrderCreatedEvent event = buildOrderEvent(150); // more than 100 in stock

        StockReservedEvent result = inventoryService.reserveStock(event);

        assertFalse(result.isSuccess());
        assertNotNull(result.getReason());
        assertTrue(result.getReason().contains("Insufficient stock"));

        // Verify no reservation was created
        List<StockReservation> reservations = stockReservationRepository.findByOrderId(orderId);
        assertTrue(reservations.isEmpty());
    }

    @Test
    void reserveStock_unknownProduct_fails() {
        OrderCreatedEvent event = OrderCreatedEvent.builder()
                .orderId(orderId).userId(userId).totalAmount(BigDecimal.TEN)
                .items(List.of(OrderCreatedEvent.OrderItemEvent.builder()
                        .productId(UUID.randomUUID()) // product doesn't exist
                        .productName("Ghost Product")
                        .price(BigDecimal.TEN).quantity(1).build()))
                .build();

        StockReservedEvent result = inventoryService.reserveStock(event);

        assertFalse(result.isSuccess());
        assertTrue(result.getReason().contains("not found in inventory"));
    }

    @Test
    void releaseReservedStock_releasesCorrectly() {
        // First reserve stock
        inventoryService.reserveStock(buildOrderEvent(10));

        // Then release
        inventoryService.releaseReservedStock(orderId);

        // Verify inventory restored
        Inventory inv = inventoryRepository.findByProductId(productId).orElseThrow();
        assertEquals(0, inv.getReservedQuantity());
        assertEquals(100, inv.getAvailable());

        // Verify reservation marked as RELEASED
        List<StockReservation> reservations = stockReservationRepository.findByOrderId(orderId);
        assertEquals(1, reservations.size());
        assertEquals("RELEASED", reservations.get(0).getStatus());
    }

    @Test
    void confirmReservation_deductsFromActualStock() {
        // Reserve 10 units
        inventoryService.reserveStock(buildOrderEvent(10));

        // Confirm
        inventoryService.confirmReservation(orderId);

        // Verify: quantity 90, reserved 0
        Inventory inv = inventoryRepository.findByProductId(productId).orElseThrow();
        assertEquals(90, inv.getQuantity());
        assertEquals(0, inv.getReservedQuantity());

        // Reservation marked CONFIRMED
        List<StockReservation> reservations = stockReservationRepository.findByOrderId(orderId);
        assertEquals("CONFIRMED", reservations.get(0).getStatus());
    }

    @Test
    void releaseReservedStock_noReservations_doesNothing() {
        // Should not throw — just a no-op
        assertDoesNotThrow(() -> inventoryService.releaseReservedStock(UUID.randomUUID()));
    }

    private OrderCreatedEvent buildOrderEvent(int quantity) {
        return OrderCreatedEvent.builder()
                .orderId(orderId)
                .userId(userId)
                .totalAmount(BigDecimal.valueOf(49.99 * quantity))
                .items(List.of(OrderCreatedEvent.OrderItemEvent.builder()
                        .productId(productId)
                        .productName("Test Widget")
                        .price(BigDecimal.valueOf(49.99))
                        .quantity(quantity)
                        .build()))
                .build();
    }
}
