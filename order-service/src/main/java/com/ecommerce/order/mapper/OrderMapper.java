// Trigger live reload
package com.ecommerce.order.mapper;

import com.ecommerce.order.dto.OrderDTO;
import com.ecommerce.order.dto.OrderItemDTO;
import com.ecommerce.order.entity.Order;
import com.ecommerce.order.entity.OrderItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "cdi")
public interface OrderMapper {

    @Mapping(target = "subtotal", expression = "java(item.getSubtotal())")
    OrderItemDTO toItemDTO(OrderItem item);

    OrderDTO toDTO(Order order);
}
