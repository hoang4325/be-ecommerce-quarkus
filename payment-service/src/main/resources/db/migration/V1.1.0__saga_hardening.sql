-- V1.1.0 Idempotency table for Kafka consumers

CREATE TABLE IF NOT EXISTS processed_events (
    event_id     VARCHAR(64) PRIMARY KEY,
    event_type   VARCHAR(64) NOT NULL,
    processed_at TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_processed_events_date ON processed_events(processed_at);
