package com.ecommerce.common.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

/**
 * Unified API response wrapper for all services.
 * All REST endpoints return this wrapper.
 */
@Getter
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private boolean success;
    private String message;
    private String errorCode;
    private T data;
    private List<FieldError> errors;
    private String timestamp;

    private ApiResponse(boolean success, String message, T data) {
        this.success = success;
        this.message = message;
        this.data = data;
        this.timestamp = Instant.now().toString();
    }

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, "Success", data);
    }

    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>(true, message, data);
    }

    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(false, message, null);
    }

    public static <T> ApiResponse<T> error(String errorCode, String message) {
        ApiResponse<T> r = new ApiResponse<>(false, message, null);
        r.errorCode = errorCode;
        return r;
    }

    public static <T> ApiResponse<T> validationError(List<FieldError> fieldErrors) {
        ApiResponse<T> r = new ApiResponse<>(false, "Validation failed", null);
        r.errorCode = "VALIDATION_ERROR";
        r.errors = fieldErrors;
        return r;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class FieldError {
        private String field;
        private String message;
    }
}
