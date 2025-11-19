package com.blockbid.blockchainservice.controller;

import com.blockbid.blockchainservice.entity.BlockchainTransaction;
import com.blockbid.blockchainservice.entity.SmartContract;
import com.blockbid.blockchainservice.service.BlockchainService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/")
@CrossOrigin(origins = "*")
public class BlockchainController {
    
    @Autowired
    private BlockchainService blockchainService;
    
    // Deploy auction smart contract (UC8)
    @PostMapping("/contracts/deploy")
    public ResponseEntity<?> deployAuctionContract(@RequestBody Map<String, Object> request) {
        try {
            Long itemId = Long.valueOf(request.get("itemId").toString());
            Long sellerId = Long.valueOf(request.get("sellerId").toString());
            
            SmartContract contract = blockchainService.deployAuctionContract(itemId, sellerId, request);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Smart contract deployed successfully");
            response.put("contractAddress", contract.getContractAddress());
            response.put("transactionHash", contract.getDeploymentTxHash());
            response.put("itemId", contract.getItemId());
            response.put("explorerUrl", "https://blockbid-explorer.com/address/" + contract.getContractAddress());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // Record bid on blockchain (UC8 - Core transparency feature)
    @PostMapping("/transactions/bid")
    public ResponseEntity<?> recordBid(@RequestBody Map<String, Object> request) {
        try {
            Long itemId = Long.valueOf(request.get("itemId").toString());
            Long bidderId = Long.valueOf(request.get("bidderId").toString());
            Double bidAmount = Double.valueOf(request.get("bidAmount").toString());
            
            String transactionHash = blockchainService.recordBid(itemId, bidderId, bidAmount);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Bid recorded on blockchain");
            response.put("transactionHash", transactionHash);
            response.put("itemId", itemId);
            response.put("bidAmount", bidAmount);
            response.put("explorerUrl", "https://blockbid-explorer.com/tx/" + transactionHash);
            response.put("blockchainVerified", true);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // End auction on blockchain (UC8)
    @PostMapping("/transactions/auction-end")
    public ResponseEntity<?> endAuction(@RequestBody Map<String, Object> request) {
        try {
            Long itemId = Long.valueOf(request.get("itemId").toString());
            Long winnerId = request.get("winnerId") != null ? Long.valueOf(request.get("winnerId").toString()) : null;
            Double winningBid = request.get("winningBid") != null ? Double.valueOf(request.get("winningBid").toString()) : 0.0;
            
            String transactionHash = blockchainService.endAuction(itemId, winnerId, winningBid);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Auction ended and recorded on blockchain");
            response.put("transactionHash", transactionHash);
            response.put("itemId", itemId);
            response.put("winnerId", winnerId);
            response.put("winningBid", winningBid);
            response.put("explorerUrl", "https://blockbid-explorer.com/tx/" + transactionHash);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // Record payment on blockchain (UC8)
    @PostMapping("/transactions/payment")
    public ResponseEntity<?> recordPayment(@RequestBody Map<String, Object> request) {
        try {
            Long itemId = Long.valueOf(request.get("itemId").toString());
            Long payerId = Long.valueOf(request.get("payerId").toString());
            Double amount = Double.valueOf(request.get("amount").toString());
            String paymentId = (String) request.get("paymentId");
            
            String transactionHash = blockchainService.recordPayment(itemId, payerId, amount, paymentId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Payment recorded on blockchain");
            response.put("transactionHash", transactionHash);
            response.put("paymentVerified", true);
            response.put("explorerUrl", "https://blockbid-explorer.com/tx/" + transactionHash);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // Get auction history from blockchain (UC8 - Transparency)
    @GetMapping("/auctions/{itemId}/history")
    public ResponseEntity<?> getAuctionHistory(@PathVariable Long itemId) {
        try {
            List<BlockchainTransaction> history = blockchainService.getAuctionHistory(itemId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("itemId", itemId);
            response.put("totalTransactions", history.size());
            response.put("transactions", history);
            response.put("blockchainVerified", true);
            response.put("explorerUrl", "https://blockbid-explorer.com/auction/" + itemId);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // Verify transaction (UC8 - Verification)
    @GetMapping("/transactions/{txHash}/verify")
    public ResponseEntity<?> verifyTransaction(@PathVariable String txHash) {
        try {
            Map<String, Object> verification = blockchainService.verifyTransaction(txHash);
            return ResponseEntity.ok(verification);
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
    
    // Get transaction details
    @GetMapping("/transactions/{txHash}")
    public ResponseEntity<?> getTransaction(@PathVariable String txHash) {
        try {
            Optional<BlockchainTransaction> transaction = blockchainService.getTransaction(txHash);
            
            if (transaction.isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Transaction not found");
                return ResponseEntity.notFound().build();
            }
            
            return ResponseEntity.ok(transaction.get());
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // Get smart contract details
    @GetMapping("/contracts/{itemId}")
    public ResponseEntity<?> getAuctionContract(@PathVariable Long itemId) {
        try {
            Optional<SmartContract> contract = blockchainService.getAuctionContract(itemId);
            
            if (contract.isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Smart contract not found for this item");
                return ResponseEntity.notFound().build();
            }
            
            return ResponseEntity.ok(contract.get());
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // Get blockchain statistics (UC8 - Analytics)
    @GetMapping("/stats")
    public ResponseEntity<?> getBlockchainStats() {
        try {
            Map<String, Object> stats = blockchainService.getBlockchainStats();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // Health check
    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "blockchain-service");
        response.put("blockchain", "BlockBid-Chain");
        response.put("network", "Active");
        return ResponseEntity.ok(response);
    }
}