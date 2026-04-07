package com.ecommerce.cart.service;

import com.ecommerce.cart.client.ProductServiceClient;
import com.ecommerce.cart.dto.AddCartItemRequest;
import com.ecommerce.cart.dto.CartDTO;
import com.ecommerce.cart.dto.UpdateCartItemRequest;
import com.ecommerce.cart.entity.Cart;
import com.ecommerce.cart.entity.CartItem;
import com.ecommerce.cart.entity.CartStatus;
import com.ecommerce.cart.mapper.CartMapper;
import com.ecommerce.cart.repository.CartItemRepository;
import com.ecommerce.cart.repository.CartRepository;
import com.ecommerce.common.dto.ApiResponse;
import com.ecommerce.common.exception.BusinessException;
import com.ecommerce.common.exception.ResourceNotFoundException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.eclipse.microprofile.rest.client.inject.RestClient;
import org.jboss.logging.Logger;

import java.util.UUID;

@ApplicationScoped
public class CartService {

    private static final Logger LOG = Logger.getLogger(CartService.class);

    @Inject CartRepository cartRepository;
    @Inject CartItemRepository cartItemRepository;
    @Inject CartMapper cartMapper;
    @RestClient ProductServiceClient productServiceClient;

    /** Get active cart, or create one if not found */
    public CartDTO getOrCreateActiveCart(UUID userId) {
        Cart cart = cartRepository.findActiveByUserId(userId)
                .orElseGet(() -> {
                    Cart newCart = new Cart(userId);
                    cartRepository.persist(newCart);
                    return newCart;
                });
        return cartMapper.toDTO(cart);
    }

    @Transactional
    public CartDTO addItem(UUID userId, AddCartItemRequest request) {
        // Validate product via product-service
        ApiResponse<ProductServiceClient.ProductInfo> productResponse = productServiceClient.getProduct(request.getProductId());
        if (productResponse == null || productResponse.getData() == null) {
            throw new ResourceNotFoundException("Product", "id", request.getProductId());
        }
        ProductServiceClient.ProductInfo product = productResponse.getData();
        if (!product.active()) {
            throw new BusinessException("Product '" + product.name() + "' is not available");
        }

        Cart cart = cartRepository.findActiveByUserId(userId)
                .orElseGet(() -> {
                    Cart newCart = new Cart(userId);
                    cartRepository.persist(newCart);
                    return newCart;
                });

        // If item already in cart, increase quantity
        cart.getItems().stream()
                .filter(item -> item.getProductId().equals(request.getProductId()))
                .findFirst()
                .ifPresentOrElse(
                        existing -> existing.setQuantity(existing.getQuantity() + request.getQuantity()),
                        () -> {
                            CartItem newItem = new CartItem(
                                    cart,
                                    product.id(),
                                    product.name(),
                                    product.price(),
                                    request.getQuantity());
                            cart.getItems().add(newItem);
                        }
                );

        LOG.infof("Added product %s to cart %s for user %s", product.name(), cart.getId(), userId);
        return cartMapper.toDTO(cart);
    }

    @Transactional
    public CartDTO updateItem(UUID userId, UUID itemId, UpdateCartItemRequest request) {
        Cart cart = cartRepository.findActiveByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Active cart", "userId", userId));

        CartItem item = cart.getItems().stream()
                .filter(i -> i.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Cart item", "id", itemId));

        item.setQuantity(request.getQuantity());
        return cartMapper.toDTO(cart);
    }

    @Transactional
    public CartDTO removeItem(UUID userId, UUID itemId) {
        Cart cart = cartRepository.findActiveByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Active cart", "userId", userId));

        CartItem item = cart.getItems().stream()
                .filter(i -> i.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Cart item", "id", itemId));

        cart.getItems().remove(item);
        cartItemRepository.delete(item);
        return cartMapper.toDTO(cart);
    }

    @Transactional
    public void clearCart(UUID userId) {
        cartRepository.findActiveByUserId(userId).ifPresent(cart -> {
            cart.getItems().clear();
            cart.setStatus(CartStatus.CHECKED_OUT);
        });
        LOG.infof("Cleared cart for user %s", userId);
    }

    /**
     * Called by order-service logic (via API) after order is placed.
     * Marks the active cart as CHECKED_OUT.
     */
    @Transactional
    public void checkoutCart(UUID userId) {
        cartRepository.findActiveByUserId(userId).ifPresent(cart -> {
            cart.setStatus(CartStatus.CHECKED_OUT);
            LOG.infof("Cart %s checked out for user %s", cart.getId(), userId);
        });
    }
}
