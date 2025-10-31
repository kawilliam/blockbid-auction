package com.blockbid.catalogue;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ItemRepository extends JpaRepository<Item, Long> {
	
	List<Item> findBySellerId(Long sellerId);
	
	List<Item> findByStatus(AuctionStatus status);
	
	List<Item> findByStatusOrderByCreatedAtDesc(AuctionStatus status);
}
