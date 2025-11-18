package com.blockbid.auctionservice.repository;

import com.blockbid.auctionservice.entity.Auction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AuctionRepository extends JpaRepository<Auction, Long> {
    
    // Find auction by item ID
    Optional<Auction> findByItemId(Long itemId);
    
    // Find active auctions
    List<Auction> findByStatusOrderByEndTimeAsc(String status);
    
    // Find auctions by seller
    List<Auction> findBySellerIdOrderByStartTimeDesc(Long sellerId);
    
    // Find auctions ending soon
    @Query("SELECT a FROM Auction a WHERE " +
           "a.status = 'ACTIVE' AND " +
           "a.endTime BETWEEN :now AND :threshold " +
           "ORDER BY a.endTime ASC")
    List<Auction> findAuctionsEndingSoon(@Param("now") LocalDateTime now, 
                                        @Param("threshold") LocalDateTime threshold);
    
    // Find expired auctions
    @Query("SELECT a FROM Auction a WHERE " +
           "a.status = 'ACTIVE' AND " +
           "a.endTime < :now")
    List<Auction> findExpiredAuctions(@Param("now") LocalDateTime now);
}