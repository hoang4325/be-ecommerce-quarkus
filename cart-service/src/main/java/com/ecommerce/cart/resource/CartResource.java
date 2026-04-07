package com.ecommerce.cart.resource;

import com.ecommerce.cart.dto.AddCartItemRequest;
import com.ecommerce.cart.dto.CartDTO;
import com.ecommerce.cart.dto.UpdateCartItemRequest;
import com.ecommerce.cart.service.CartService;
import com.ecommerce.common.dto.ApiResponse;

import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.security.SecurityRequirement;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.util.UUID;

@Path("/api/cart")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Cart", description = "Shopping cart management")
@SecurityRequirement(name = "JWT")
public class CartResource {

    @Inject CartService cartService;
    @Inject org.eclipse.microprofile.jwt.JsonWebToken jwt;

    private UUID currentUserId() {
        return UUID.fromString(jwt.getSubject());
    }

    @GET
    @RolesAllowed({"USER", "ADMIN"})
    @Operation(summary = "Get active cart (or creates a new one if none exists)")
    public ApiResponse<CartDTO> getCart() {
        return ApiResponse.success(cartService.getOrCreateActiveCart(currentUserId()));
    }

    @POST
    @Path("/items")
    @RolesAllowed({"USER", "ADMIN"})
    @Operation(summary = "Add item to active cart")
    public ApiResponse<CartDTO> addItem(@Valid AddCartItemRequest request) {
        return ApiResponse.success("Item added to cart", cartService.addItem(currentUserId(), request));
    }

    @PUT
    @Path("/items/{itemId}")
    @RolesAllowed({"USER", "ADMIN"})
    @Operation(summary = "Update cart item quantity")
    public ApiResponse<CartDTO> updateItem(
            @PathParam("itemId") UUID itemId,
            @Valid UpdateCartItemRequest request) {
        return ApiResponse.success("Item updated", cartService.updateItem(currentUserId(), itemId, request));
    }

    @DELETE
    @Path("/items/{itemId}")
    @RolesAllowed({"USER", "ADMIN"})
    @Operation(summary = "Remove item from cart")
    public ApiResponse<CartDTO> removeItem(@PathParam("itemId") UUID itemId) {
        return ApiResponse.success("Item removed", cartService.removeItem(currentUserId(), itemId));
    }

    @DELETE
    @RolesAllowed({"USER", "ADMIN"})
    @Operation(summary = "Clear cart")
    public Response clearCart() {
        cartService.clearCart(currentUserId());
        return Response.noContent().build();
    }
}
