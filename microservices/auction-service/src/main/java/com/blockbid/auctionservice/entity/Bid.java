package com.blockbid.auctionservice.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "bids")
public class Bid {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    @NotNull(message = "Item ID is required")
    private Long itemId;
    
    @Column(nullable = false)
    @NotNull(message = "Bidder ID is required")
    private Long bidderId;
    
    @Column(nullable = false)
    @NotNull(message = "Bid amount is required")
    @DecimalMin(value = "0.01", message = "Bid amount must be at least $0.01")
    private Double amount;
    
    @Column(nullable = false)
    private LocalDateTime bidTime;
    
    @Column(nullable = false)
    private String status = "ACTIVE"; // ACTIVE, OUTBID, WINNING
    
    @Column
    private String transactionHash; // For blockchain integration (UC8)
    
    @PrePersist
    protected void onCreate() {
        bidTime = LocalDateTime.now();
    }
    
    // Constructors
    public Bid() {}
    
    public Bid(Long itemId, Long bidderId, Double amount) {
        this.itemId = itemId;
        this.bidderId = bidderId;
        this.amount = amount;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Long getItemId() { return itemId; }
    public void setItemId(Long itemId) { this.itemId = itemId; }
    
    public Long getBidderId() { return bidderId; }
    public void setBidderId(Long bidderId) { this.bidderId = bidderId; }
    
    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }
    
    public LocalDateTime getBidTime() { return bidTime; }
    public void setBidTime(LocalDateTime bidTime) { this.bidTime = bidTime; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public String getTransactionHash() { return transactionHash; }
    public void setTransactionHash(String transactionHash) { this.transactionHash = transactionHash; }
}