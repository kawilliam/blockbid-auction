package com.blockbid.paymentservice.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "orders")
public class Order {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true)
    private String orderNumber;
    
    @Column(nullable = false)
    private Long paymentId;
    
    @Column(nullable = false)
    private Long itemId;
    
    @Column(nullable = false)
    private String itemName;
    
    @Column(nullable = false)
    private String itemDescription;
    
    @Column(nullable = false)
    private Long userId;
    
    @Column(nullable = false)
    private String status = "PROCESSING"; // PROCESSING, SHIPPED, DELIVERED, CANCELLED
    
    @Column(nullable = false)
    private LocalDateTime orderDate;
    
    @Column
    private LocalDateTime estimatedDelivery;
    
    @Column
    private String trackingNumber;
    
    @PrePersist
    protected void onCreate() {
        orderDate = LocalDateTime.now();
        if (orderNumber == null) {
            orderNumber = generateOrderNumber();
        }
    }
    
    // Constructors
    public Order() {}
    
    public Order(Long paymentId, Long itemId, String itemName, String itemDescription, Long userId) {
        this.paymentId = paymentId;
        this.itemId = itemId;
        this.itemName = itemName;
        this.itemDescription = itemDescription;
        this.userId = userId;
    }
    
    // Generate order number
    private String generateOrderNumber() {
        return "ORD" + System.currentTimeMillis();
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }
    
    public Long getPaymentId() { return paymentId; }
    public void setPaymentId(Long paymentId) { this.paymentId = paymentId; }
    
    public Long getItemId() { return itemId; }
    public void setItemId(Long itemId) { this.itemId = itemId; }
    
    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }
    
    public String getItemDescription() { return itemDescription; }
    public void setItemDescription(String itemDescription) { this.itemDescription = itemDescription; }
    
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public LocalDateTime getOrderDate() { return orderDate; }
    public void setOrderDate(LocalDateTime orderDate) { this.orderDate = orderDate; }
    
    public LocalDateTime getEstimatedDelivery() { return estimatedDelivery; }
    public void setEstimatedDelivery(LocalDateTime estimatedDelivery) { this.estimatedDelivery = estimatedDelivery; }
    
    public String getTrackingNumber() { return trackingNumber; }
    public void setTrackingNumber(String trackingNumber) { this.trackingNumber = trackingNumber; }
}