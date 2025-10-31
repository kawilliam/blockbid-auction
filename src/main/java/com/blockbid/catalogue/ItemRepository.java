package com.blockbid.catalogue;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface ItemRepository extends JpaRepository<Item, Long> {
	
	List<Item> findBySellerId(Long sellerId);
	
	List<Item> findByStatus(AuctionStatus status);
	
	List<Item> findByStatusOrderByCreatedAtDesc(AuctionStatus status);
	
	List<Item> findByTitleContainingIgnoreCaseAndStatus(String keyword, AuctionStatus status);
	
	List<Item> findByDescriptionContainingIgnoreCaseAndStatus(String keyword, AuctionStatus status);
	
	@Query("SELECT i FROM Item i WHERE (LOWER(i.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(i.description) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND i.status = :status")
	List<Item> searchByKeyword(@Param("keyword") String keyword, @Param("status") AuctionStatus status);
}
