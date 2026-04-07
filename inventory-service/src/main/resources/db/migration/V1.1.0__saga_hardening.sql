-- V1.1.0 Saga hardening: stock reservation tracking + idempotency

-- Track which items were reserved for each order (for compensation/release)
CREATE TABLE IF NOT EXISTS stock_reservation (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id    UUID        NOT NULL,
    product_id  UUID        NOT NULL,
    quantity    INTEGER     NOT NULL,
    status      VARCHAR(20) NOT NULL DEFAULT 'RESERVED',
    created_at  TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_reservation_order ON stock_reservation(order_id);

-- Idempotency table for Kafka consumers
CREATE TABLE IF NOT EXISTS processed_events (
    event_id     VARCHAR(64) PRIMARY KEY,
    event_type   VARCHAR(64) NOT NULL,
    processed_at TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_processed_events_date ON processed_events(processed_at);
