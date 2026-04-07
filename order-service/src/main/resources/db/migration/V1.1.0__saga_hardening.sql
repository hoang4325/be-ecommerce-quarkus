-- V1.1.0 Add STOCK_RESERVED status + cancellation_reason + processed_events

-- Expand status constraint to include STOCK_RESERVED
ALTER TABLE orders DROP CONSTRAINT IF EXISTS chk_order_status;
ALTER TABLE orders ADD CONSTRAINT chk_order_status
    CHECK (status IN ('PENDING', 'STOCK_RESERVED', 'CONFIRMED', 'CANCELLED'));

-- Audit trail for cancelled orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Idempotency table for Kafka consumers
CREATE TABLE IF NOT EXISTS processed_events (
    event_id     VARCHAR(64)  PRIMARY KEY,
    event_type   VARCHAR(64)  NOT NULL,
    processed_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_processed_events_date ON processed_events(processed_at);
