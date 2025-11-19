package com.blockbid.blockchainservice.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "smart_contracts")
public class SmartContract {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true)
    private String contractAddress;
    
    @Column(nullable = false)
    private String contractType = "AUCTION"; // AUCTION, PAYMENT, ESCROW
    
    @Column(nullable = false)
    private Long itemId;
    
    @Column(nullable = false)
    private Long ownerId; // Seller ID
    
    @Column(nullable = false)
    private String status = "ACTIVE"; // ACTIVE, ENDED, CANCELLED
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String contractData; // JSON contract details
    
    @Column(nullable = false)
    private LocalDateTime deployedAt;
    
    @Column
    private LocalDateTime endedAt;
    
    @Column(nullable = false)
    private String deploymentTxHash;
    
    @PrePersist
    protected void onCreate() {
        if (deployedAt == null) {
            deployedAt = LocalDateTime.now();
        }
    }
    
    // Constructors
    public SmartContract() {}
    
    public SmartContract(String contractAddress, Long itemId, Long ownerId, String contractData) {
        this.contractAddress = contractAddress;
        this.itemId = itemId;
        this.ownerId = ownerId;
        this.contractData = contractData;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getContractAddress() { return contractAddress; }
    public void setContractAddress(String contractAddress) { this.contractAddress = contractAddress; }
    
    public String getContractType() { return contractType; }
    public void setContractType(String contractType) { this.contractType = contractType; }
    
    public Long getItemId() { return itemId; }
    public void setItemId(Long itemId) { this.itemId = itemId; }
    
    public Long getOwnerId() { return ownerId; }
    public void setOwnerId(Long ownerId) { this.ownerId = ownerId; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public String getContractData() { return contractData; }
    public void setContractData(String contractData) { this.contractData = contractData; }
    
    public LocalDateTime getDeployedAt() { return deployedAt; }
    public void setDeployedAt(LocalDateTime deployedAt) { this.deployedAt = deployedAt; }
    
    public LocalDateTime getEndedAt() { return endedAt; }
    public void setEndedAt(LocalDateTime endedAt) { this.endedAt = endedAt; }
    
    public String getDeploymentTxHash() { return deploymentTxHash; }
    public void setDeploymentTxHash(String deploymentTxHash) { this.deploymentTxHash = deploymentTxHash; }
}