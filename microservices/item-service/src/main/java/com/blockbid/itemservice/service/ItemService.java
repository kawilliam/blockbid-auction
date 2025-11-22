package com.blockbid.itemservice.service;

import com.blockbid.itemservice.entity.Item;
import com.blockbid.itemservice.repository.ItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class ItemService {
    
    @Autowired
    private ItemRepository itemRepository;
    
    @Autowired
    private RestTemplate restTemplate;
    
    private static final String AUCTION_SERVICE_URL = "http://auction-service:8083";
    
    // Create new item (UC7 - Seller functionality)
    public Item createItem(Item item) throws Exception {
        // Validate item data
        if (item.getName() == null || item.getName().trim().isEmpty()) {
            throw new Exception("Item name is required");
        }
        
        if (item.getStartingPrice() == null || item.getStartingPrice() <= 0) {
            throw new Exception("Starting price must be greater than 0");
        }
        
        if (item.getEndTime() == null || item.getEndTime().isBefore(LocalDateTime.now())) {
            throw new Exception("End time must be in the future");
        }
        
        if (item.getReservePrice() != null && item.getReservePrice() < item.getStartingPrice()) {
            throw new Exception("Reserve price must be greater than or equal to starting price");
        }
        
        // Set defaults
        item.setStatus("ACTIVE");
        item.setCurrentPrice(item.getStartingPrice());
        item.setBidCount(0);
        
        // Save item first
        Item savedItem = itemRepository.save(item);
        
        System.out.println("✓ Item created - ID: " + savedItem.getId());
        
        // ===== CREATE AUCTION IN AUCTION SERVICE =====
        try {
            Map<String, Object> auctionRequest = new HashMap<>();
            auctionRequest.put("itemId", savedItem.getId());
            auctionRequest.put("sellerId", savedItem.getSellerId());
            auctionRequest.put("startingPrice", savedItem.getStartingPrice());
            auctionRequest.put("endTime", savedItem.getEndTime().toString());
            
            if (savedItem.getReservePrice() != null) {
                auctionRequest.put("reservePrice", savedItem.getReservePrice());
            }
            
            System.out.println("→ Creating auction: " + auctionRequest);
            
            @SuppressWarnings("unchecked")
            Map<String, Object> auctionResponse = restTemplate.postForObject(
                AUCTION_SERVICE_URL + "/",
                auctionRequest,
                Map.class
            );
            
            System.out.println("✓ Auction created: " + auctionResponse);
            
        } catch (Exception e) {
            System.err.println("✗ ERROR: Failed to create auction: " + e.getMessage());
            e.printStackTrace();
            // Rollback item creation
            itemRepository.delete(savedItem);
            throw new Exception("Failed to create auction: " + e.getMessage());
        }
        
        return savedItem;
    }
    
    // Get all active items
    public List<Item> getAllActiveItems() {
        return itemRepository.findByStatusOrderByCreatedAtDesc("ACTIVE");
    }
    
    // Search items by keyword
    public List<Item> searchItems(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return getAllActiveItems();
        }
        return itemRepository.searchByKeyword(keyword.trim());
    }
    
    // Get items by category
    public List<Item> getItemsByCategory(String category) {
        return itemRepository.findByCategoryAndStatusOrderByCreatedAtDesc(category, "ACTIVE");
    }
    
    // Get item by ID
    public Optional<Item> getItemById(Long id) {
        return itemRepository.findById(id);
    }
    
    // Get items by seller
    public List<Item> getItemsBySeller(Long sellerId) {
        return itemRepository.findBySellerIdOrderByCreatedAtDesc(sellerId);
    }
    
    // Update item (for bid updates)
    public Item updateItem(Item item) {
        return itemRepository.save(item);
    }
    
    // Update item price and bid info (called by Auction Service)
    public Item updateItemBid(Long itemId, Double newPrice, Long bidderId) throws Exception {
        Optional<Item> itemOptional = itemRepository.findById(itemId);
        
        if (itemOptional.isEmpty()) {
            throw new Exception("Item not found");
        }
        
        Item item = itemOptional.get();
        
        if (!item.isActive()) {
            throw new Exception("Auction is not active");
        }
        
        if (newPrice <= item.getCurrentPrice()) {
            throw new Exception("Bid must be higher than current price");
        }
        
        // Update item with new bid
        item.setCurrentPrice(newPrice);
        item.setHighestBidderId(bidderId);
        item.setBidCount(item.getBidCount() + 1);
        
        return itemRepository.save(item);
    }
    
    // End auction
    public Item endAuction(Long itemId) throws Exception {
        Optional<Item> itemOptional = itemRepository.findById(itemId);
        
        if (itemOptional.isEmpty()) {
            throw new Exception("Item not found");
        }
        
        Item item = itemOptional.get();
        item.setStatus("ENDED");
        
        return itemRepository.save(item);
    }
    
    // Get items ending soon (next hour)
    public List<Item> getItemsEndingSoon() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime oneHourLater = now.plusHours(1);
        return itemRepository.findItemsEndingSoon(now, oneHourLater);
    }
    
    // Update expired items (background task)
    public void updateExpiredItems() {
        List<Item> expiredItems = itemRepository.findExpiredItems(LocalDateTime.now());
        
        for (Item item : expiredItems) {
            item.setStatus("ENDED");
            itemRepository.save(item);
        }
    }
    
    // Get seller statistics
    public long getActiveItemCountBySeller(Long sellerId) {
        return itemRepository.countBySellerIdAndStatus(sellerId, "ACTIVE");
    }
}