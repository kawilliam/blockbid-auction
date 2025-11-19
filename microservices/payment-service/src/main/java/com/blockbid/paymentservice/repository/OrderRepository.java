package com.blockbid.paymentservice.repository;

import com.blockbid.paymentservice.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    
    // Find orders by user
    List<Order> findByUserIdOrderByOrderDateDesc(Long userId);
    
    // Find order by payment ID
    Optional<Order> findByPaymentId(Long paymentId);
    
    // Find order by order number
    Optional<Order> findByOrderNumber(String orderNumber);
    
    // Find orders by status
    List<Order> findByStatusOrderByOrderDateDesc(String status);
    
    // Find orders by item
    List<Order> findByItemIdOrderByOrderDateDesc(Long itemId);
}