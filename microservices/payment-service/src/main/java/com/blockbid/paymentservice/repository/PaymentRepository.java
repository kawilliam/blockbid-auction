package com.blockbid.paymentservice.repository;

import com.blockbid.paymentservice.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    
    // Find payments by user
    List<Payment> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    // Find payment by transaction ID
    Optional<Payment> findByTransactionId(String transactionId);
    
    // Find payments by item
    List<Payment> findByItemIdOrderByCreatedAtDesc(Long itemId);
    
    // Find payments by status
    List<Payment> findByStatusOrderByCreatedAtDesc(String status);
    
    // Find payments within date range
    List<Payment> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime start, LocalDateTime end);
    
    // Check if payment exists for item and user
    boolean existsByItemIdAndUserId(Long itemId, Long userId);
}