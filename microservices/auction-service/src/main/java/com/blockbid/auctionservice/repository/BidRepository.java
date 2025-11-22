package com.blockbid.auctionservice.repository;

import com.blockbid.auctionservice.entity.Bid;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BidRepository extends JpaRepository<Bid, Long> {
    
    // Find bids for an item ordered by amount (highest first)
    List<Bid> findByItemIdOrderByAmountDesc(Long itemId);
    
    // Find bids for an item ordered by time (newest first)
    List<Bid> findByItemIdOrderByBidTimeDesc(Long itemId);
    
    // Find bids by bidder
    List<Bid> findByBidderIdOrderByBidTimeDesc(Long bidderId);
    
    // Find highest bid for an item - FIXED: Using findFirst to limit to 1 result
    Optional<Bid> findFirstByItemIdOrderByAmountDescBidTimeDesc(Long itemId);
    
    // Alias for backward compatibility
    default Optional<Bid> findHighestBidForItem(Long itemId) {
        return findFirstByItemIdOrderByAmountDescBidTimeDesc(itemId);
    }
    
    // Count bids for an item
    long countByItemId(Long itemId);
    
    // Check if user has bid on item
    boolean existsByItemIdAndBidderId(Long itemId, Long bidderId);
    
    // Find user's highest bid for an item - FIXED: Using findFirst
    Optional<Bid> findFirstByItemIdAndBidderIdOrderByAmountDescBidTimeDesc(Long itemId, Long bidderId);
    
    // Alias for backward compatibility
    default Optional<Bid> findUserHighestBidForItem(Long itemId, Long bidderId) {
        return findFirstByItemIdAndBidderIdOrderByAmountDescBidTimeDesc(itemId, bidderId);
    }
}