package com.ecommerce.inventory.repository;

import com.ecommerce.inventory.entity.StockReservation;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class StockReservationRepository implements PanacheRepositoryBase<StockReservation, UUID> {

    public List<StockReservation> findByOrderId(UUID orderId) {
        return list("orderId", orderId);
    }

    public List<StockReservation> findByOrderIdAndStatus(UUID orderId, String status) {
        return list("orderId = ?1 and status = ?2", orderId, status);
    }
}
