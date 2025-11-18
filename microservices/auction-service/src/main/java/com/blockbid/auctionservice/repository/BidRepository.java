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
    
    // Find highest bid for an item
    @Query("SELECT b FROM Bid b WHERE b.itemId = :itemId AND b.amount = " +
           "(SELECT MAX(b2.amount) FROM Bid b2 WHERE b2.itemId = :itemId)")
    Optional<Bid> findHighestBidForItem(@Param("itemId") Long itemId);
    
    // Count bids for an item
    long countByItemId(Long itemId);
    
    // Check if user has bid on item
    boolean existsByItemIdAndBidderId(Long itemId, Long bidderId);
    
    // Find user's highest bid for an item
    @Query("SELECT b FROM Bid b WHERE b.itemId = :itemId AND b.bidderId = :bidderId " +
           "AND b.amount = (SELECT MAX(b2.amount) FROM Bid b2 WHERE b2.itemId = :itemId AND b2.bidderId = :bidderId)")
    Optional<Bid> findUserHighestBidForItem(@Param("itemId") Long itemId, @Param("bidderId") Long bidderId);
}