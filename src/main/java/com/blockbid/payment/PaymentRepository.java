package com.blockbid.payment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
	
	Optional<Payment> findByItemId(Long itemId);
	
	List<Payment> findByBuyerId(Long buyerId);
	
	boolean existsByItemId(Long itemId);
}
