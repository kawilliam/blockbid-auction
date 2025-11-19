package com.blockbid.blockchainservice.service;

import com.blockbid.blockchainservice.blockchain.BlockchainUtils;
import com.blockbid.blockchainservice.entity.BlockchainTransaction;
import com.blockbid.blockchainservice.entity.SmartContract;
import com.blockbid.blockchainservice.repository.BlockchainTransactionRepository;
import com.blockbid.blockchainservice.repository.SmartContractRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class BlockchainService {
    
    @Autowired
    private BlockchainTransactionRepository transactionRepository;
    
    @Autowired
    private SmartContractRepository contractRepository;
    
    @Autowired
    private BlockchainUtils blockchainUtils;
    
    // Deploy smart contract for new auction (UC8)
    @Transactional
    public SmartContract deployAuctionContract(Long itemId, Long sellerId, Map<String, Object> auctionData) throws Exception {
        // Check if contract already exists
        if (contractRepository.existsByItemId(itemId)) {
            throw new Exception("Smart contract already exists for this item");
        }
        
        // Generate contract address
        String contractAddress = blockchainUtils.generateContractAddress();
        
        // Create contract data
        String contractData = blockchainUtils.createTransactionData(
            "AUCTION_CONTRACT",
            "itemId", itemId,
            "sellerId", sellerId,
            "startingPrice", auctionData.get("startingPrice"),
            "endTime", auctionData.get("endTime"),
            "auctionType", "FORWARD"
        );
        
        // Create deployment transaction
        String deployTxHash = recordTransaction("AUCTION_CREATE", itemId, sellerId, contractData);
        
        // Create smart contract record
        SmartContract contract = new SmartContract(contractAddress, itemId, sellerId, contractData);
        contract.setDeploymentTxHash(deployTxHash);
        
        SmartContract savedContract = contractRepository.save(contract);
        
        // Simulate blockchain confirmation
        confirmTransaction(deployTxHash);
        
        return savedContract;
    }
    
    // Record bid on blockchain (UC8 - Core transparency feature)
    public String recordBid(Long itemId, Long bidderId, Double bidAmount) throws Exception {
        // Verify auction contract exists
        Optional<SmartContract> contractOptional = contractRepository.findByItemId(itemId);
        if (contractOptional.isEmpty()) {
            throw new Exception("No smart contract found for this auction");
        }
        
        SmartContract contract = contractOptional.get();
        if (!"ACTIVE".equals(contract.getStatus())) {
            throw new Exception("Auction contract is not active");
        }
        
        // Create bid data
        String bidData = blockchainUtils.createTransactionData(
            "BID",
            "itemId", itemId,
            "bidderId", bidderId,
            "amount", bidAmount,
            "contractAddress", contract.getContractAddress()
        );
        
        // Record transaction on blockchain
        String txHash = recordTransaction("BID", itemId, bidderId, bidData);
        
        // Simulate blockchain confirmation
        confirmTransaction(txHash);
        
        return txHash;
    }
    
    // End auction and finalize on blockchain (UC8)
    @Transactional
    public String endAuction(Long itemId, Long winnerId, Double winningBid) throws Exception {
        Optional<SmartContract> contractOptional = contractRepository.findByItemId(itemId);
        if (contractOptional.isEmpty()) {
            throw new Exception("No smart contract found for this auction");
        }
        
        SmartContract contract = contractOptional.get();
        
        // Create auction end data
        String endData = blockchainUtils.createTransactionData(
            "AUCTION_END",
            "itemId", itemId,
            "winnerId", winnerId,
            "winningBid", winningBid,
            "contractAddress", contract.getContractAddress()
        );
        
        // Record transaction
        String txHash = recordTransaction("AUCTION_END", itemId, winnerId, endData);
        
        // Update contract status
        contract.setStatus("ENDED");
        contract.setEndedAt(LocalDateTime.now());
        contractRepository.save(contract);
        
        // Confirm transaction
        confirmTransaction(txHash);
        
        return txHash;
    }
    
    // Record payment on blockchain (UC8)
    public String recordPayment(Long itemId, Long payerId, Double amount, String paymentId) throws Exception {
        String paymentData = blockchainUtils.createTransactionData(
            "PAYMENT",
            "itemId", itemId,
            "payerId", payerId,
            "amount", amount,
            "paymentId", paymentId
        );
        
        String txHash = recordTransaction("PAYMENT", itemId, payerId, paymentData);
        confirmTransaction(txHash);
        
        return txHash;
    }
    
    // Generic transaction recording
    private String recordTransaction(String type, Long itemId, Long userId, String data) {
        // Generate transaction hash
        String txHash = blockchainUtils.generateTransactionHash(data);
        
        // Create blockchain transaction
        BlockchainTransaction transaction = new BlockchainTransaction(txHash, type, itemId, data);
        transaction.setUserId(userId);
        transaction.setGasUsed(blockchainUtils.estimateGas(type));
        transaction.setStatus("PENDING");
        
        transactionRepository.save(transaction);
        
        return txHash;
    }
    
    // Simulate blockchain confirmation
    private void confirmTransaction(String txHash) {
        // Simulate async confirmation process
        new Thread(() -> {
            try {
                blockchainUtils.simulateBlockConfirmation();
                
                Optional<BlockchainTransaction> txOptional = transactionRepository.findByTransactionHash(txHash);
                if (txOptional.isPresent()) {
                    BlockchainTransaction tx = txOptional.get();
                    tx.setStatus("CONFIRMED");
                    tx.setConfirmations(1);
                    tx.setBlockNumber(blockchainUtils.getNextBlockNumber());
                    tx.setBlockHash(blockchainUtils.generateBlockHash());
                    transactionRepository.save(tx);
                }
            } catch (Exception e) {
                System.err.println("Error confirming transaction: " + e.getMessage());
            }
        }).start();
    }
    
    // Get auction history from blockchain (UC8 - Transparency)
    public List<BlockchainTransaction> getAuctionHistory(Long itemId) {
        return transactionRepository.findByItemIdOrderByTimestampDesc(itemId);
    }
    
    // Get transaction by hash
    public Optional<BlockchainTransaction> getTransaction(String txHash) {
        return transactionRepository.findByTransactionHash(txHash);
    }
    
    // Get contract by item ID
    public Optional<SmartContract> getAuctionContract(Long itemId) {
        return contractRepository.findByItemId(itemId);
    }
    
    // Verify transaction authenticity (UC8)
    public Map<String, Object> verifyTransaction(String txHash) throws Exception {
        Optional<BlockchainTransaction> txOptional = transactionRepository.findByTransactionHash(txHash);
        if (txOptional.isEmpty()) {
            throw new Exception("Transaction not found");
        }
        
        BlockchainTransaction tx = txOptional.get();
        
        Map<String, Object> verification = new HashMap<>();
        verification.put("transactionHash", tx.getTransactionHash());
        verification.put("blockNumber", tx.getBlockNumber());
        verification.put("blockHash", tx.getBlockHash());
        verification.put("status", tx.getStatus());
        verification.put("confirmations", tx.getConfirmations());
        verification.put("timestamp", tx.getTimestamp());
        verification.put("type", tx.getTransactionType());
        verification.put("verified", "CONFIRMED".equals(tx.getStatus()));
        verification.put("explorerUrl", "https://blockbid-explorer.com/tx/" + txHash);
        
        return verification;
    }
    
    // Get blockchain statistics
    public Map<String, Object> getBlockchainStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalTransactions", transactionRepository.count());
        stats.put("totalContracts", contractRepository.count());
        stats.put("bidTransactions", transactionRepository.countByTransactionType("BID"));
        stats.put("auctionContracts", contractRepository.findByContractTypeOrderByDeployedAtDesc("AUCTION").size());
        stats.put("latestTransactions", transactionRepository.findLatestTransactions());
        
        return stats;
    }
}