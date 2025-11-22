package com.blockbid.auctionservice.controller;

import com.blockbid.auctionservice.entity.Auction;
import com.blockbid.auctionservice.entity.Bid;
import com.blockbid.auctionservice.service.AuctionService;
import com.blockbid.auctionservice.validation.BidValidator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.ArrayList;

@RestController
@RequestMapping("/")
@CrossOrigin(origins = "*")
public class AuctionController {
	
	@Autowired
    private RestTemplate restTemplate;
    
    @Autowired
    private AuctionService auctionService;
    
    // Create auction (called by Item Service when item is created)
    @PostMapping("/")
    public ResponseEntity<?> createAuction(@RequestBody Map<String, Object> request) {
        try {
            Auction auction = new Auction();
            auction.setItemId(Long.valueOf(request.get("itemId").toString()));
            auction.setSellerId(Long.valueOf(request.get("sellerId").toString()));
            auction.setStartingPrice(Double.valueOf(request.get("startingPrice").toString()));
            
            if (request.get("reservePrice") != null) {
                auction.setReservePrice(Double.valueOf(request.get("reservePrice").toString()));
            }
            
            String endTimeStr = (String) request.get("endTime");
            auction.setEndTime(LocalDateTime.parse(endTimeStr));
            
            Auction savedAuction = auctionService.createAuction(auction);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Auction created successfully");
            response.put("auctionId", savedAuction.getId());
            response.put("itemId", savedAuction.getItemId());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // Place bid (UC3 - Core bidding functionality)
    @PostMapping("/{itemId}/bid")
    public ResponseEntity<?> placeBid(@PathVariable Long itemId, @RequestBody Map<String, Object> request) {
        try {
        	System.out.println("=== PLACE BID REQUEST ===");
            System.out.println("Item ID: " + itemId);
            System.out.println("Request body: " + request);
            // Get current auction to check current price
            Optional<Auction> auctionOpt = auctionService.getAuctionByItemId(itemId);
            if (auctionOpt.isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Auction not found");
                return ResponseEntity.notFound().build();
            }
            
            Auction auction = auctionOpt.get();
            System.out.println("Auction found - Status: " + auction.getStatus() + ", Current Price: " + auction.getCurrentPrice());
            
            // Check if auction is still active
            if (!"ACTIVE".equals(auction.getStatus())) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Auction has ended");
                return ResponseEntity.badRequest().body(error);
            }
            
            // Validate bid
            Map<String, String> validationErrors = BidValidator.validateBid(request, auction.getCurrentPrice());
            if (!validationErrors.isEmpty()) {
            	System.out.println("ERROR: Validation failed - " + validationErrors);
                return ResponseEntity.badRequest().body(validationErrors);
            }
            
            Long bidderId;
            try {
                Object bidderIdObj = request.get("bidderId");
                if (bidderIdObj == null) {
                	System.out.println("ERROR: bidderId is null");
                    Map<String, String> error = new HashMap<>();
                    error.put("field", "bidderId");
                    error.put("message", "Bidder ID is required");
                    return ResponseEntity.badRequest().body(error);
                }
                bidderId = Long.valueOf(bidderIdObj.toString());
                System.out.println("Bidder ID parsed: " + bidderId);
            } catch (NumberFormatException e) {
            	System.out.println("ERROR: Invalid bidderId format - " + e.getMessage());
                Map<String, String> error = new HashMap<>();
                error.put("field", "bidderId");
                error.put("message", "Invalid bidder ID format");
                return ResponseEntity.badRequest().body(error);
            }
            
            Double bidAmount;
            try {
                Object amountObj = request.get("amount");
                if (amountObj == null) {
                	System.out.println("ERROR: amount is null");
                    Map<String, String> error = new HashMap<>();
                    error.put("field", "amount");
                    error.put("message", "Bid amount is required");
                    return ResponseEntity.badRequest().body(error);
                }
                
                // Handle both Integer and Double from JSON
                if (amountObj instanceof Number) {
                    bidAmount = ((Number) amountObj).doubleValue();
                } else {
                    bidAmount = Double.valueOf(amountObj.toString());
                }
                System.out.println("Bid amount parsed: " + bidAmount);
            } catch (NumberFormatException e) {
            	System.out.println("ERROR: Invalid amount format - " + e.getMessage());
                Map<String, String> error = new HashMap<>();
                error.put("field", "amount");
                error.put("message", "Invalid bid amount format");
                return ResponseEntity.badRequest().body(error);
            }
            
            System.out.println("Calling placeBid service with: itemId=" + itemId + ", bidderId=" + bidderId + ", amount=" + bidAmount);
            Bid bid = auctionService.placeBid(itemId, bidderId, bidAmount);
            System.out.println("Bid placed successfully - Bid ID: " + bid.getId());
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Bid placed successfully");
            response.put("bidId", bid.getId());
            response.put("amount", bid.getAmount());
            response.put("bidTime", bid.getBidTime());
            response.put("status", bid.getStatus());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
        	System.out.println("ERROR in placeBid: " + e.getMessage());
            Map<String, String> error = new HashMap<>();
            
            // Handle specific errors
            if (e.getMessage().contains("Bid must be higher")) {
                error.put("field", "amount");
                error.put("message", e.getMessage());
            } else if (e.getMessage().contains("Auction has ended")) {
                error.put("message", "Auction has ended");
            } else {
                error.put("message", "Failed to place bid: " + e.getMessage());
            }
            
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // Get auction details
    @GetMapping("/{itemId}")
    public ResponseEntity<?> getAuction(@PathVariable Long itemId) {
        try {
            Optional<Auction> auctionOptional = auctionService.getAuctionByItemId(itemId);
            
            if (auctionOptional.isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Auction not found");
                return ResponseEntity.notFound().build();
            }
            
            Auction auction = auctionOptional.get();
            
            // Add time remaining
            Map<String, Object> response = new HashMap<>();
            response.put("auction", auction);
            response.put("timeRemaining", auction.getTimeRemaining());
            response.put("totalBids", auctionService.getTotalBidsForItem(itemId));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // Get bid history
    @GetMapping("/{itemId}/bids")
    public ResponseEntity<?> getBidHistory(@PathVariable Long itemId) {
    	try {
            List<Bid> bids = auctionService.getBidHistory(itemId);
            
            // Enhance bids with bidder information
            List<Map<String, Object>> enhancedBids = new ArrayList<>();
            
            for (Bid bid : bids) {
                Map<String, Object> bidMap = new HashMap<>();
                bidMap.put("id", bid.getId());
                bidMap.put("itemId", bid.getItemId());
                bidMap.put("bidderId", bid.getBidderId());
                bidMap.put("amount", bid.getAmount());
                bidMap.put("bidTime", bid.getBidTime());
                bidMap.put("status", bid.getStatus());
                
                // Try to fetch bidder name from user service
                try {
                    String userServiceUrl = "http://user-service:8081/users/" + bid.getBidderId();
                    Map<String, Object> user = restTemplate.getForObject(userServiceUrl, Map.class);
                    if (user != null && user.get("username") != null) {
                        bidMap.put("bidderName", user.get("username"));
                    }
                } catch (Exception e) {
                    // If user service call fails, just use the ID
                    bidMap.put("bidderName", "User #" + bid.getBidderId());
                }
                
                enhancedBids.add(bidMap);
            }
            
            return ResponseEntity.ok(enhancedBids);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // Get highest bid
    @GetMapping("/{itemId}/highest-bid")
    public ResponseEntity<?> getHighestBid(@PathVariable Long itemId) {
        try {
            Optional<Bid> highestBid = auctionService.getHighestBid(itemId);
            
            if (highestBid.isEmpty()) {
                Map<String, String> message = new HashMap<>();
                message.put("message", "No bids found");
                return ResponseEntity.ok(message);
            }
            
            return ResponseEntity.ok(highestBid.get());
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // Get user's bids
    @GetMapping("/users/{userId}/bids")
    public ResponseEntity<?> getUserBids(@PathVariable Long userId) {
        try {
            List<Bid> bids = auctionService.getUserBids(userId);
            return ResponseEntity.ok(bids);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // End auction
    @PutMapping("/{itemId}/end")
    public ResponseEntity<?> endAuction(@PathVariable Long itemId) {
        try {
            Auction auction = auctionService.endAuction(itemId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Auction ended successfully");
            response.put("auction", auction);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // Get active auctions
    @GetMapping("/")
    public ResponseEntity<?> getActiveAuctions() {
        try {
            List<Auction> auctions = auctionService.getActiveAuctions();
            return ResponseEntity.ok(auctions);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "auction-service");
        return ResponseEntity.ok(response);
    }
}