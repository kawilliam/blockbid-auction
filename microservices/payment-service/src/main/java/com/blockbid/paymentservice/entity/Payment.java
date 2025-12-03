package com.blockbid.paymentservice.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
public class Payment {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    @NotNull(message = "Item ID is required")
    private Long itemId;
    
    @Column(nullable = false)
    @NotNull(message = "User ID is required")
    private Long userId;
    
    @Column(nullable = false)
    @NotNull(message = "Total amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be at least $0.01")
    private Double totalAmount;
    
    @Column(nullable = false)
    private Double itemPrice;
    
    @Column(nullable = false)
    private Double shippingCost = 0.0;
    
    @Column(nullable = false)
    private String shippingType = "standard"; // standard, expedited
    
    @Column(columnDefinition = "TEXT")
    private String shippingAddress;
    
    @Column(nullable = false)
    private String streetNumber;
    
    @Column(nullable = false)
    private String streetName;
    
    @Column(nullable = false)
    private String city;
    
    @Column(nullable = false)
    private String province;
    
    @Column(nullable = false)
    private String postalCode;
    
    @Column(nullable = false)
    private String country;
    
    @Column(nullable = false)
    private String status = "PENDING"; // PENDING, COMPLETED, FAILED, REFUNDED
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    @Column
    private LocalDateTime completedAt;
    
    @Column(nullable = false, unique = true)
    private String transactionId;
    
    // Payment method details (stored securely)
    @Column(nullable = false)
    private String cardLastFour;
    
    @Column(nullable = false)
    private String cardholderName;
    
    @Column(nullable = false)
    private String paymentMethod = "CREDIT_CARD";
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (transactionId == null) {
            transactionId = generateTransactionId();
        }
    }
    
    // Constructors
    public Payment() {}
    
    public Payment(Long itemId, Long userId, Double totalAmount, String streetNumber, 
            String streetName, String city, String province, 
            String postalCode, String country) {
        this.itemId = itemId;
        this.userId = userId;
        this.totalAmount = totalAmount;
        this.shippingAddress = shippingAddress;
    }
    
    // Generate transaction ID
    private String generateTransactionId() {
        return "TXN" + System.currentTimeMillis() + String.valueOf(id != null ? id : 0);
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Long getItemId() { return itemId; }
    public void setItemId(Long itemId) { this.itemId = itemId; }
    
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    
    public Double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(Double totalAmount) { this.totalAmount = totalAmount; }
    
    public Double getItemPrice() { return itemPrice; }
    public void setItemPrice(Double itemPrice) { this.itemPrice = itemPrice; }
    
    public Double getShippingCost() { return shippingCost; }
    public void setShippingCost(Double shippingCost) { this.shippingCost = shippingCost; }
    
    public String getShippingType() { return shippingType; }
    public void setShippingType(String shippingType) { this.shippingType = shippingType; }
    
    public String getShippingAddress() { return shippingAddress; }
    public void setShippingAddress(String shippingAddress) { this.shippingAddress = shippingAddress; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
    
    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }
    
    public String getCardLastFour() { return cardLastFour; }
    public void setCardLastFour(String cardLastFour) { this.cardLastFour = cardLastFour; }
    
    public String getCardholderName() { return cardholderName; }
    public void setCardholderName(String cardholderName) { this.cardholderName = cardholderName; }
    
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    
    public String getStreetNumber() { return streetNumber; }
    public void setStreetNumber(String streetNumber) { this.streetNumber = streetNumber; }
    
    public String getStreetName() { return streetName; }
    public void setStreetName(String streetName) { this.streetName = streetName; }
    
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    
    public String getProvince() { return province; }
    public void setProvince(String province) { this.province = province; }
    
    public String getPostalCode() { return postalCode; }
    public void setPostalCode(String postalCode) { this.postalCode = postalCode; }
    
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    
    // Helper methods
    public boolean isCompleted() {
        return "COMPLETED".equals(status);
    }
    
    public boolean isPending() {
        return "PENDING".equals(status);
    }
    
    public void complete() {
        this.status = "COMPLETED";
        this.completedAt = LocalDateTime.now();
    }
    
    public void fail() {
        this.status = "FAILED";
    }
}