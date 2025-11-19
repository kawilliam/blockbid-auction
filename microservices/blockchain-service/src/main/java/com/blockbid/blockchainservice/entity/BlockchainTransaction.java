package com.blockbid.blockchainservice.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "blockchain_transactions")
public class BlockchainTransaction {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true)
    private String transactionHash;
    
    @Column(nullable = false)
    private String blockHash;
    
    @Column(nullable = false)
    private Long blockNumber;
    
    @Column(nullable = false)
    private String transactionType; // BID, AUCTION_CREATE, AUCTION_END, PAYMENT
    
    @Column(nullable = false)
    private Long itemId;
    
    @Column
    private Long userId;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String transactionData; // JSON data
    
    @Column(nullable = false)
    private LocalDateTime timestamp;
    
    @Column(nullable = false)
    private String status = "PENDING"; // PENDING, CONFIRMED, FAILED
    
    @Column(nullable = false)
    private Integer confirmations = 0;
    
    @Column
    private String gasUsed;
    
    @PrePersist
    protected void onCreate() {
        if (timestamp == null) {
            timestamp = LocalDateTime.now();
        }
    }
    
    // Constructors
    public BlockchainTransaction() {}
    
    public BlockchainTransaction(String transactionHash, String transactionType, 
                                Long itemId, String transactionData) {
        this.transactionHash = transactionHash;
        this.transactionType = transactionType;
        this.itemId = itemId;
        this.transactionData = transactionData;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getTransactionHash() { return transactionHash; }
    public void setTransactionHash(String transactionHash) { this.transactionHash = transactionHash; }
    
    public String getBlockHash() { return blockHash; }
    public void setBlockHash(String blockHash) { this.blockHash = blockHash; }
    
    public Long getBlockNumber() { return blockNumber; }
    public void setBlockNumber(Long blockNumber) { this.blockNumber = blockNumber; }
    
    public String getTransactionType() { return transactionType; }
    public void setTransactionType(String transactionType) { this.transactionType = transactionType; }
    
    public Long getItemId() { return itemId; }
    public void setItemId(Long itemId) { this.itemId = itemId; }
    
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    
    public String getTransactionData() { return transactionData; }
    public void setTransactionData(String transactionData) { this.transactionData = transactionData; }
    
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public Integer getConfirmations() { return confirmations; }
    public void setConfirmations(Integer confirmations) { this.confirmations = confirmations; }
    
    public String getGasUsed() { return gasUsed; }
    public void setGasUsed(String gasUsed) { this.gasUsed = gasUsed; }
}