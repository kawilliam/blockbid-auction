package com.blockbid.auction;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface BidRepository extends JpaRepository<Bid, Long> {
	
	List<Bid> findByItemIdOrderByAmountDesc(Long itemId);
	
	@Query("SELECT b FROM Bid b WHERE b.item.id = :itemId ORDER BY b.amount DESC LIMIT 1")
	Optional<Bid> findHighestBidForItem(Long itemId);
	
	List<Bid> findByBidderId(Long bidderId);
}
