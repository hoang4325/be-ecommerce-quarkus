package com.ecommerce.inventory.service;

import com.ecommerce.common.event.OrderCreatedEvent;
import com.ecommerce.common.event.StockReservedEvent;
import com.ecommerce.common.exception.BusinessException;
import com.ecommerce.common.exception.ResourceNotFoundException;
import com.ecommerce.inventory.dto.CreateInventoryRequest;
import com.ecommerce.inventory.dto.InventoryDTO;
import com.ecommerce.inventory.entity.Inventory;
import com.ecommerce.inventory.entity.StockReservation;
import com.ecommerce.inventory.repository.InventoryRepository;
import com.ecommerce.inventory.repository.StockReservationRepository;
import io.micrometer.core.instrument.MeterRegistry;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;

import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class InventoryService {

    private static final Logger LOG = Logger.getLogger(InventoryService.class);

    @Inject InventoryRepository inventoryRepository;
    @Inject StockReservationRepository stockReservationRepository;
    @Inject MeterRegistry meterRegistry;

    public List<InventoryDTO> findAll() {
        return inventoryRepository.listAll().stream().map(this::toDTO).toList();
    }

    public InventoryDTO findByProductId(UUID productId) {
        Inventory inv = inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory", "productId", productId));
        return toDTO(inv);
    }

    @Transactional
    public InventoryDTO create(CreateInventoryRequest request) {
        if (inventoryRepository.findByProductId(request.getProductId()).isPresent()) {
            throw new BusinessException("Inventory entry already exists for product " + request.getProductId());
        }
        Inventory inv = new Inventory();
        inv.setProductId(request.getProductId());
        inv.setProductName(request.getProductName());
        inv.setQuantity(request.getQuantity());
        inv.setReservedQuantity(0);
        inventoryRepository.persist(inv);
        LOG.infof("Created inventory for product %s: qty=%d", request.getProductName(), request.getQuantity());
        return toDTO(inv);
    }

    @Transactional
    public InventoryDTO updateStock(UUID productId, int newQuantity) {
        Inventory inv = inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory", "productId", productId));
        inv.setQuantity(newQuantity);
        LOG.infof("Updated stock for product %s: qty=%d", inv.getProductName(), newQuantity);
        return toDTO(inv);
    }

    /**
     * Try to reserve stock for all items in an order.
     * Saves StockReservation records for each item (used for compensation).
     */
    @Transactional
    public StockReservedEvent reserveStock(OrderCreatedEvent event) {
        // Phase 1: Validate all items
        for (OrderCreatedEvent.OrderItemEvent item : event.getItems()) {
            var optInv = inventoryRepository.findByProductId(item.getProductId());
            if (optInv.isEmpty()) {
                LOG.warnf("No inventory for product %s — order %s rejected", item.getProductId(), event.getOrderId());
                meterRegistry.counter("stock.reservation.failed", "reason", "not_found").increment();
                return StockReservedEvent.builder()
                        .orderId(event.getOrderId())
                        .userId(event.getUserId())
                        .success(false)
                        .reason("Product " + item.getProductName() + " not found in inventory")
                        .totalAmount(event.getTotalAmount())
                        .build();
            }
            Inventory inv = optInv.get();
            if (inv.getAvailable() < item.getQuantity()) {
                LOG.warnf("Insufficient stock for %s (%d available, %d requested) — order %s",
                        item.getProductName(), inv.getAvailable(), item.getQuantity(), event.getOrderId());
                meterRegistry.counter("stock.reservation.failed", "reason", "insufficient").increment();
                return StockReservedEvent.builder()
                        .orderId(event.getOrderId())
                        .userId(event.getUserId())
                        .success(false)
                        .reason("Insufficient stock for " + item.getProductName())
                        .totalAmount(event.getTotalAmount())
                        .build();
            }
        }

        // Phase 2: Reserve + track
        for (OrderCreatedEvent.OrderItemEvent item : event.getItems()) {
            Inventory inv = inventoryRepository.findByProductId(item.getProductId()).get();
            inv.setReservedQuantity(inv.getReservedQuantity() + item.getQuantity());

            // Save reservation record for compensation
            stockReservationRepository.persist(
                    new StockReservation(event.getOrderId(), item.getProductId(), item.getQuantity()));
        }

        LOG.infof("Stock reserved for order %s (%d items)", event.getOrderId(), event.getItems().size());
        meterRegistry.counter("stock.reserved").increment();
        return StockReservedEvent.builder()
                .orderId(event.getOrderId())
                .userId(event.getUserId())
                .success(true)
                .totalAmount(event.getTotalAmount())
                .build();
    }

    /**
     * Compensation: release reserved stock when order is cancelled.
     */
    @Transactional
    public void releaseReservedStock(UUID orderId) {
        List<StockReservation> reservations = stockReservationRepository.findByOrderIdAndStatus(orderId, "RESERVED");
        for (StockReservation res : reservations) {
            inventoryRepository.findByProductId(res.getProductId()).ifPresent(inv -> {
                inv.setReservedQuantity(Math.max(0, inv.getReservedQuantity() - res.getQuantity()));
                LOG.infof("Released %d units of %s for cancelled order %s",
                        res.getQuantity(), inv.getProductName(), orderId);
            });
            res.setStatus("RELEASED");
        }
    }

    /**
     * Confirm reservations when order is confirmed (optional audit).
     */
    @Transactional
    public void confirmReservation(UUID orderId) {
        List<StockReservation> reservations = stockReservationRepository.findByOrderIdAndStatus(orderId, "RESERVED");
        for (StockReservation res : reservations) {
            // Deduct from actual quantity, release reserved
            inventoryRepository.findByProductId(res.getProductId()).ifPresent(inv -> {
                inv.setQuantity(inv.getQuantity() - res.getQuantity());
                inv.setReservedQuantity(Math.max(0, inv.getReservedQuantity() - res.getQuantity()));
            });
            res.setStatus("CONFIRMED");
        }
        LOG.infof("Reservations confirmed for order %s", orderId);
    }

    private InventoryDTO toDTO(Inventory inv) {
        return InventoryDTO.builder()
                .id(inv.getId())
                .productId(inv.getProductId())
                .productName(inv.getProductName())
                .quantity(inv.getQuantity())
                .reservedQuantity(inv.getReservedQuantity())
                .available(inv.getAvailable())
                .build();
    }
}
