package com.blockbid.blockchainservice.blockchain;

import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Component
public class BlockchainUtils {
    
    private static final SecureRandom random = new SecureRandom();
    private static long blockCounter = 1000000L; // Starting block number
    
    // Generate transaction hash (simulates Ethereum transaction hash)
    public String generateTransactionHash(String data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            String input = data + System.currentTimeMillis() + random.nextLong();
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            
            // Convert to hex string (Ethereum format)
            StringBuilder hexString = new StringBuilder("0x");
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            
            return hexString.toString().substring(0, 66); // Ethereum hash length
            
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Error generating hash", e);
        }
    }
    
    // Generate contract address (simulates Ethereum contract deployment)
    public String generateContractAddress() {
        String prefix = "0x";
        StringBuilder address = new StringBuilder(prefix);
        
        // Generate 40 character hex address (Ethereum format)
        for (int i = 0; i < 40; i++) {
            int digit = random.nextInt(16);
            address.append(Integer.toHexString(digit));
        }
        
        return address.toString();
    }
    
    // Generate block hash
    public String generateBlockHash() {
        return generateTransactionHash("BLOCK" + getNextBlockNumber());
    }
    
    // Get next block number
    public synchronized long getNextBlockNumber() {
        return ++blockCounter;
    }
    
    // Simulate gas estimation
    public String estimateGas(String transactionType) {
        switch (transactionType.toUpperCase()) {
            case "BID":
                return "21000"; // Simple transaction
            case "AUCTION_CREATE":
                return "500000"; // Contract deployment
            case "AUCTION_END":
                return "100000"; // Contract execution
            case "PAYMENT":
                return "50000"; // Token transfer
            default:
                return "21000";
        }
    }
    
    // Create transaction data JSON
    public String createTransactionData(String type, Object... params) {
        StringBuilder json = new StringBuilder("{");
        json.append("\"type\":\"").append(type).append("\",");
        json.append("\"timestamp\":\"").append(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)).append("\",");
        json.append("\"network\":\"BlockBid-Chain\",");
        
        if (params.length >= 2) {
            for (int i = 0; i < params.length; i += 2) {
                json.append("\"").append(params[i]).append("\":\"").append(params[i + 1]).append("\",");
            }
        }
        
        // Remove last comma and close JSON
        if (json.charAt(json.length() - 1) == ',') {
            json.setLength(json.length() - 1);
        }
        json.append("}");
        
        return json.toString();
    }
    
    // Validate transaction hash format
    public boolean isValidTransactionHash(String hash) {
        return hash != null && hash.startsWith("0x") && hash.length() == 66;
    }
    
    // Validate contract address format
    public boolean isValidContractAddress(String address) {
        return address != null && address.startsWith("0x") && address.length() == 42;
    }
    
    // Simulate blockchain confirmation delay
    public void simulateBlockConfirmation() {
        try {
            // Simulate 15 second block time (like Ethereum)
            Thread.sleep(2000); // Shortened for demo
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}