package com.ecommerce.common.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * Standard envelope for all Kafka events.
 * Provides metadata for idempotency, tracing, and versioning.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventEnvelope<T> {

    private String eventId;        // Unique event ID — for deduplication
    private String eventType;      // "order-created", "stock-reserved", etc.
    private int version;           // Schema version for forward compatibility
    private String source;         // Producing service name
    private Instant timestamp;     // When the event was produced
    private String correlationId;  // Trace across services (= orderId in saga)
    private T payload;

    /**
     * Convenience factory to wrap a payload into an envelope.
     */
    public static <T> EventEnvelope<T> wrap(String type, String source, T payload, String correlationId) {
        return EventEnvelope.<T>builder()
                .eventId(UUID.randomUUID().toString())
                .eventType(type)
                .version(1)
                .source(source)
                .timestamp(Instant.now())
                .correlationId(correlationId)
                .payload(payload)
                .build();
    }
}
