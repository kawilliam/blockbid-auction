package com.blockbid.auctionservice.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "auctions")
public class Auction {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private Long itemId;
    
    @Column(nullable = false)
    private Long sellerId;
    
    @Column(nullable = false)
    private Double startingPrice;
    
    @Column
    private Double reservePrice;
    
    @Column(nullable = false)
    private LocalDateTime startTime;
    
    @Column(nullable = false)
    private LocalDateTime endTime;
    
    @Column(nullable = false)
    private String status = "ACTIVE"; // ACTIVE, ENDED, CANCELLED
    
    @Column
    private Double currentPrice;
    
    @Column
    private Long highestBidderId;
    
    @Column
    private Long winningBidId;
    
    @Column
    private Integer totalBids = 0;
    
    @PrePersist
    protected void onCreate() {
        if (startTime == null) {
            startTime = LocalDateTime.now();
        }
        if (currentPrice == null) {
            currentPrice = startingPrice;
        }
    }
    
    // Constructors
    public Auction() {}
    
    public Auction(Long itemId, Long sellerId, Double startingPrice, LocalDateTime endTime) {
        this.itemId = itemId;
        this.sellerId = sellerId;
        this.startingPrice = startingPrice;
        this.currentPrice = startingPrice;
        this.endTime = endTime;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Long getItemId() { return itemId; }
    public void setItemId(Long itemId) { this.itemId = itemId; }
    
    public Long getSellerId() { return sellerId; }
    public void setSellerId(Long sellerId) { this.sellerId = sellerId; }
    
    public Double getStartingPrice() { return startingPrice; }
    public void setStartingPrice(Double startingPrice) { this.startingPrice = startingPrice; }
    
    public Double getReservePrice() { return reservePrice; }
    public void setReservePrice(Double reservePrice) { this.reservePrice = reservePrice; }
    
    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }
    
    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public Double getCurrentPrice() { return currentPrice; }
    public void setCurrentPrice(Double currentPrice) { this.currentPrice = currentPrice; }
    
    public Long getHighestBidderId() { return highestBidderId; }
    public void setHighestBidderId(Long highestBidderId) { this.highestBidderId = highestBidderId; }
    
    public Long getWinningBidId() { return winningBidId; }
    public void setWinningBidId(Long winningBidId) { this.winningBidId = winningBidId; }
    
    public Integer getTotalBids() { return totalBids; }
    public void setTotalBids(Integer totalBids) { this.totalBids = totalBids; }
    
    // Helper methods
    public boolean isActive() {
        return "ACTIVE".equals(status) && LocalDateTime.now().isBefore(endTime);
    }
    
    public boolean hasEnded() {
        return "ENDED".equals(status) || LocalDateTime.now().isAfter(endTime);
    }
    
    public long getTimeRemaining() {
        if (hasEnded()) return 0;
        return java.time.Duration.between(LocalDateTime.now(), endTime).toSeconds();
    }
}