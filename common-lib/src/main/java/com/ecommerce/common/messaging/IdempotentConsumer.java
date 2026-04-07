package com.ecommerce.common.messaging;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;

/**
 * Idempotency guard for Kafka consumers.
 * Usage:
 * <pre>
 *   if (idempotentConsumer.isDuplicate(eventId, eventType)) return;
 *   // ... your business logic (MUST be in same transaction)
 * </pre>
 */
@ApplicationScoped
public class IdempotentConsumer {

    private static final Logger LOG = Logger.getLogger(IdempotentConsumer.class);

    @Inject
    EntityManager em;

    /**
     * Check if an event has already been processed.
     * If not, marks it as processed (insert).
     *
     * IMPORTANT: Call this INSIDE the same @Transactional boundary as your business logic.
     * If business logic fails, the rollback will also remove the processed_events record,
     * allowing the event to be re-processed on retry.
     *
     * @return true if the event was already processed (= skip), false if new (= process)
     */
    @Transactional(Transactional.TxType.MANDATORY)
    public boolean isDuplicate(String eventId, String eventType) {
        ProcessedEvent existing = em.find(ProcessedEvent.class, eventId);
        if (existing != null) {
            LOG.warnf("Duplicate event detected: %s [%s] — skipping", eventId, eventType);
            return true;
        }
        em.persist(new ProcessedEvent(eventId, eventType));
        return false;
    }
}
