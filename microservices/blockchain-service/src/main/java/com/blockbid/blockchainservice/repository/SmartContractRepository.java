package com.blockbid.blockchainservice.repository;

import com.blockbid.blockchainservice.entity.SmartContract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SmartContractRepository extends JpaRepository<SmartContract, Long> {
    
    // Find contract by address
    Optional<SmartContract> findByContractAddress(String contractAddress);
    
    // Find contract by item ID
    Optional<SmartContract> findByItemId(Long itemId);
    
    // Find contracts by owner
    List<SmartContract> findByOwnerIdOrderByDeployedAtDesc(Long ownerId);
    
    // Find contracts by status
    List<SmartContract> findByStatusOrderByDeployedAtDesc(String status);
    
    // Find contracts by type
    List<SmartContract> findByContractTypeOrderByDeployedAtDesc(String contractType);
    
    // Check if contract exists for item
    boolean existsByItemId(Long itemId);
}