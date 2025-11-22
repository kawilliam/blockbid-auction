package com.blockbid.itemservice.controller;

import com.blockbid.itemservice.entity.Item;
import com.blockbid.itemservice.service.ItemService;
import org.springframework.beans.factory.annotation.Autowired;
import com.blockbid.itemservice.validation.ItemValidator;
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
public class ItemController {
    
    @Autowired
    private ItemService itemService;
    
    // Create new item (UC7 - Seller functionality)
    @PostMapping("/")
    public ResponseEntity<?> createItem(@RequestBody Map<String, Object> request) {
        try {
            // Validate input
            Map<String, String> validationErrors = ItemValidator.validateItem(request);
            if (!validationErrors.isEmpty()) {
                return ResponseEntity.badRequest().body(validationErrors);
            }
            
            Item item = new Item();
            item.setName((String) request.get("name"));
            item.setDescription((String) request.get("description"));
            item.setStartingPrice(Double.valueOf(request.get("startingPrice").toString()));
            item.setCategory((String) request.get("category"));
            item.setCondition((String) request.get("condition"));
            item.setAuctionType((String) request.get("auctionType"));
            item.setSellerId(Long.valueOf(request.get("sellerId").toString()));
            
            String endTimeStr = (String) request.get("endTime");
            item.setEndTime(LocalDateTime.parse(endTimeStr));
            
            // Optional fields
            if (request.get("reservePrice") != null) {
                item.setReservePrice(Double.valueOf(request.get("reservePrice").toString()));
            }
            if (request.get("shippingCost") != null) {
                item.setShippingCost(Double.valueOf(request.get("shippingCost").toString()));
            }
            if (request.get("expeditedShippingCost") != null) {
                item.setExpeditedShippingCost(Double.valueOf(request.get("expeditedShippingCost").toString()));
            }
            if (request.get("shippingDetails") != null) {
                item.setShippingDetails((String) request.get("shippingDetails"));
            }
            
            Item savedItem = itemService.createItem(item);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Item created successfully");
            response.put("id", savedItem.getId());
            response.put("name", savedItem.getName());
            response.put("status", savedItem.getStatus());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to create item: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // Get all active items
    @GetMapping("/")
    public ResponseEntity<?> getAllItems() {
        try {
            List<Item> items = itemService.getAllActiveItems();
            return ResponseEntity.ok(items);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // Search items
    @GetMapping("/search")
    public ResponseEntity<?> searchItems(@RequestParam(required = false) String keyword) {
        try {
            List<Item> items = itemService.searchItems(keyword);
            return ResponseEntity.ok(items);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // Get item by ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getItem(@PathVariable Long id) {
        try {
            Optional<Item> itemOptional = itemService.getItemById(id);
            
            if (itemOptional.isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Item not found");
                return ResponseEntity.notFound().build();
            }
            
            return ResponseEntity.ok(itemOptional.get());
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // Get items by category
    @GetMapping("/category/{category}")
    public ResponseEntity<?> getItemsByCategory(@PathVariable String category) {
        try {
            List<Item> items = itemService.getItemsByCategory(category);
            return ResponseEntity.ok(items);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // Get items by seller
    @GetMapping("/sellers/{sellerId}/items")
    public ResponseEntity<?> getItemsBySeller(@PathVariable Long sellerId) {
        try {
            List<Item> items = itemService.getItemsBySeller(sellerId);
            return ResponseEntity.ok(items);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // Update item bid (called by Auction Service)
    @PutMapping("/{id}/bid")
    public ResponseEntity<?> updateItemBid(@PathVariable Long id, 
                                           @RequestBody Map<String, Object> request) {
        try {
            Double newPrice = Double.valueOf(request.get("price").toString());
            Long bidderId = Long.valueOf(request.get("bidderId").toString());
            
            Item updatedItem = itemService.updateItemBid(id, newPrice, bidderId);
            
            return ResponseEntity.ok(updatedItem);
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // End auction
    @PutMapping("/{id}/end")
    public ResponseEntity<?> endAuction(@PathVariable Long id) {
        try {
            Item item = itemService.endAuction(id);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Auction ended successfully");
            response.put("item", item);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // Get items ending soon
    @GetMapping("/ending-soon")
    public ResponseEntity<?> getItemsEndingSoon() {
        try {
            List<Item> items = itemService.getItemsEndingSoon();
            return ResponseEntity.ok(items);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        Map<String, String> status = new HashMap<>();
        status.put("status", "UP");
        status.put("service", "item-service"); // Change per service
        return ResponseEntity.ok(status);
    }
}