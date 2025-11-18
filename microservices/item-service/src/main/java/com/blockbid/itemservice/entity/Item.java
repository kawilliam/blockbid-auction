package com.blockbid.itemservice.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "items")
public class Item {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    @NotBlank(message = "Item name is required")
    @Size(max = 100, message = "Item name must be less than 100 characters")
    private String name;
    
    @Column(nullable = false, length = 500)
    @NotBlank(message = "Description is required")
    @Size(max = 500, message = "Description must be less than 500 characters")
    private String description;
    
    @Column(nullable = false)
    @NotNull(message = "Starting price is required")
    @DecimalMin(value = "0.01", message = "Starting price must be at least $0.01")
    private Double startingPrice;
    
    @Column
    private Double reservePrice;
    
    @Column(nullable = false)
    @NotBlank(message = "Category is required")
    private String category;
    
    @Column(nullable = false)
    @NotBlank(message = "Condition is required")
    private String condition;
    
    @Column(nullable = false)
    @NotBlank(message = "Auction type is required")
    private String auctionType = "forward";
    
    @Column(nullable = false)
    @NotNull(message = "End time is required")
    private LocalDateTime endTime;
    
    @Column(nullable = false)
    private Double shippingCost = 0.0;
    
    @Column(nullable = false)
    private Double expeditedShippingCost = 15.0;
    
    @Column(length = 200)
    private String shippingDetails;
    
    @Column(nullable = false)
    @NotNull(message = "Seller ID is required")
    private Long sellerId;
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private String status = "ACTIVE"; // ACTIVE, ENDED, CANCELLED
    
    // For auction tracking
    @Column
    private Double currentPrice;
    
    @Column
    private Long highestBidderId;
    
    @Column
    private Integer bidCount = 0;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (currentPrice == null) {
            currentPrice = startingPrice;
        }
    }
    
    // Constructors
    public Item() {}
    
    public Item(String name, String description, Double startingPrice, 
                String category, String condition, LocalDateTime endTime, Long sellerId) {
        this.name = name;
        this.description = description;
        this.startingPrice = startingPrice;
        this.currentPrice = startingPrice;
        this.category = category;
        this.condition = condition;
        this.endTime = endTime;
        this.sellerId = sellerId;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public Double getStartingPrice() { return startingPrice; }
    public void setStartingPrice(Double startingPrice) { this.startingPrice = startingPrice; }
    
    public Double getReservePrice() { return reservePrice; }
    public void setReservePrice(Double reservePrice) { this.reservePrice = reservePrice; }
    
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    
    public String getCondition() { return condition; }
    public void setCondition(String condition) { this.condition = condition; }
    
    public String getAuctionType() { return auctionType; }
    public void setAuctionType(String auctionType) { this.auctionType = auctionType; }
    
    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }
    
    public Double getShippingCost() { return shippingCost; }
    public void setShippingCost(Double shippingCost) { this.shippingCost = shippingCost; }
    
    public Double getExpeditedShippingCost() { return expeditedShippingCost; }
    public void setExpeditedShippingCost(Double expeditedShippingCost) { this.expeditedShippingCost = expeditedShippingCost; }
    
    public String getShippingDetails() { return shippingDetails; }
    public void setShippingDetails(String shippingDetails) { this.shippingDetails = shippingDetails; }
    
    public Long getSellerId() { return sellerId; }
    public void setSellerId(Long sellerId) { this.sellerId = sellerId; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public Double getCurrentPrice() { return currentPrice; }
    public void setCurrentPrice(Double currentPrice) { this.currentPrice = currentPrice; }
    
    public Long getHighestBidderId() { return highestBidderId; }
    public void setHighestBidderId(Long highestBidderId) { this.highestBidderId = highestBidderId; }
    
    public Integer getBidCount() { return bidCount; }
    public void setBidCount(Integer bidCount) { this.bidCount = bidCount; }
    
    // Helper methods
    public boolean isActive() {
        return "ACTIVE".equals(status) && LocalDateTime.now().isBefore(endTime);
    }
    
    public boolean hasEnded() {
        return "ENDED".equals(status) || LocalDateTime.now().isAfter(endTime);
    }
}