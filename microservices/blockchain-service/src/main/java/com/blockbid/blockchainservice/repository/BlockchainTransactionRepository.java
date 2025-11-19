package com.blockbid.blockchainservice.repository;

import com.blockbid.blockchainservice.entity.BlockchainTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BlockchainTransactionRepository extends JpaRepository<BlockchainTransaction, Long> {
    
    // Find transaction by hash
    Optional<BlockchainTransaction> findByTransactionHash(String transactionHash);
    
    // Find transactions by item ID
    List<BlockchainTransaction> findByItemIdOrderByTimestampDesc(Long itemId);
    
    // Find transactions by user ID
    List<BlockchainTransaction> findByUserIdOrderByTimestampDesc(Long userId);
    
    // Find transactions by type
    List<BlockchainTransaction> findByTransactionTypeOrderByTimestampDesc(String transactionType);
    
    // Find transactions by status
    List<BlockchainTransaction> findByStatusOrderByTimestampDesc(String status);
    
    // Find transactions in date range
    List<BlockchainTransaction> findByTimestampBetweenOrderByTimestampDesc(LocalDateTime start, LocalDateTime end);
    
    // Find transactions by block number
    List<BlockchainTransaction> findByBlockNumber(Long blockNumber);
    
    // Count transactions for an item
    long countByItemId(Long itemId);
    
    // Count transactions by type
    long countByTransactionType(String transactionType);
    
    // Find latest transactions
    @Query("SELECT t FROM BlockchainTransaction t ORDER BY t.timestamp DESC")
    List<BlockchainTransaction> findLatestTransactions();
}