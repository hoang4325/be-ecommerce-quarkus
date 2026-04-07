package com.ecommerce.common.filter;

import jakarta.annotation.Priority;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.container.ContainerResponseContext;
import jakarta.ws.rs.container.ContainerResponseFilter;
import jakarta.ws.rs.ext.Provider;
import org.jboss.logging.MDC;

import java.util.UUID;

/**
 * JAX-RS filter that propagates or generates a correlation ID.
 * The correlationId is:
 * - Read from incoming X-Correlation-ID header (if present)
 * - Generated as a new UUID (if absent)
 * - Placed into MDC for structured logging
 * - Echoed back in the response header
 */
@Provider
@Priority(Priorities.HEADER_DECORATOR)
public class CorrelationIdFilter implements ContainerRequestFilter, ContainerResponseFilter {

    public static final String HEADER_NAME = "X-Correlation-ID";
    public static final String MDC_KEY = "correlationId";

    @Override
    public void filter(ContainerRequestContext requestContext) {
        String correlationId = requestContext.getHeaderString(HEADER_NAME);
        if (correlationId == null || correlationId.isBlank()) {
            correlationId = UUID.randomUUID().toString();
        }
        MDC.put(MDC_KEY, correlationId);
    }

    @Override
    public void filter(ContainerRequestContext requestContext, ContainerResponseContext responseContext) {
        Object correlationId = MDC.get(MDC_KEY);
        if (correlationId != null) {
            responseContext.getHeaders().putSingle(HEADER_NAME, correlationId.toString());
        }
        MDC.remove(MDC_KEY);
    }
}
