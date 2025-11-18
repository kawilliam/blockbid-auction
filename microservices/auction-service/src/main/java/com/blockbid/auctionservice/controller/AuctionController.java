package com.blockbid.auctionservice.controller;

import com.blockbid.auctionservice.entity.Auction;
import com.blockbid.auctionservice.entity.Bid;
import com.blockbid.auctionservice.service.AuctionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/")
@CrossOrigin(origins = "*")
public class AuctionController {
    
    @Autowired
    private AuctionService auctionService;
    
    // Create auction (called by Item Service when item is created)
    @PostMapping("/auctions")
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
    @PostMapping("/auctions/{itemId}/bids")
    public ResponseEntity<?> placeBid(@PathVariable Long itemId, 
                                     @RequestBody Map<String, Object> request) {
        try {
            Long bidderId = Long.valueOf(request.get("bidderId").toString());
            Double bidAmount = Double.valueOf(request.get("amount").toString());
            
            Bid bid = auctionService.placeBid(itemId, bidderId, bidAmount);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Bid placed successfully");
            response.put("bidId", bid.getId());
            response.put("amount", bid.getAmount());
            response.put("bidTime", bid.getBidTime());
            response.put("status", bid.getStatus());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // Get auction details
    @GetMapping("/auctions/{itemId}")
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
    @GetMapping("/auctions/{itemId}/bids")
    public ResponseEntity<?> getBidHistory(@PathVariable Long itemId) {
        try {
            List<Bid> bids = auctionService.getBidHistory(itemId);
            return ResponseEntity.ok(bids);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // Get highest bid
    @GetMapping("/auctions/{itemId}/highest-bid")
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
    @PutMapping("/auctions/{itemId}/end")
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
    @GetMapping("/auctions")
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
}