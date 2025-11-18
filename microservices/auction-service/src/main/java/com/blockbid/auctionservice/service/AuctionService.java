package com.blockbid.auctionservice.service;

import com.blockbid.auctionservice.entity.Auction;
import com.blockbid.auctionservice.entity.Bid;
import com.blockbid.auctionservice.repository.AuctionRepository;
import com.blockbid.auctionservice.repository.BidRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class AuctionService {
    
    @Autowired
    private AuctionRepository auctionRepository;
    
    @Autowired
    private BidRepository bidRepository;
    
    // Create new auction
    public Auction createAuction(Auction auction) throws Exception {
        // Validate auction data
        if (auction.getItemId() == null) {
            throw new Exception("Item ID is required");
        }
        
        if (auction.getStartingPrice() == null || auction.getStartingPrice() <= 0) {
            throw new Exception("Starting price must be greater than 0");
        }
        
        if (auction.getEndTime() == null || auction.getEndTime().isBefore(LocalDateTime.now())) {
            throw new Exception("End time must be in the future");
        }
        
        // Check if auction already exists for this item
        Optional<Auction> existingAuction = auctionRepository.findByItemId(auction.getItemId());
        if (existingAuction.isPresent()) {
            throw new Exception("Auction already exists for this item");
        }
        
        return auctionRepository.save(auction);
    }
    
    // Place a bid (UC3 - Core bidding functionality)
    @Transactional
    public Bid placeBid(Long itemId, Long bidderId, Double bidAmount) throws Exception {
        // Find the auction
        Optional<Auction> auctionOptional = auctionRepository.findByItemId(itemId);
        if (auctionOptional.isEmpty()) {
            throw new Exception("Auction not found for this item");
        }
        
        Auction auction = auctionOptional.get();
        
        // Check if auction is active
        if (!auction.isActive()) {
            throw new Exception("Auction is not active");
        }
        
        // Check if bidder is not the seller
        if (bidderId.equals(auction.getSellerId())) {
            throw new Exception("Seller cannot bid on their own item");
        }
        
        // Validate bid amount
        if (bidAmount <= auction.getCurrentPrice()) {
            throw new Exception("Bid must be higher than current price of $" + auction.getCurrentPrice());
        }
        
        // Check reserve price if set
        if (auction.getReservePrice() != null && bidAmount < auction.getReservePrice()) {
            // Allow bid but note it doesn't meet reserve
        }
        
        // Mark previous highest bidder as outbid
        if (auction.getHighestBidderId() != null) {
            Optional<Bid> previousHighestBid = bidRepository.findHighestBidForItem(itemId);
            if (previousHighestBid.isPresent()) {
                Bid prevBid = previousHighestBid.get();
                prevBid.setStatus("OUTBID");
                bidRepository.save(prevBid);
            }
        }
        
        // Create new bid
        Bid newBid = new Bid(itemId, bidderId, bidAmount);
        newBid.setStatus("WINNING");
        Bid savedBid = bidRepository.save(newBid);
        
        // Update auction
        auction.setCurrentPrice(bidAmount);
        auction.setHighestBidderId(bidderId);
        auction.setWinningBidId(savedBid.getId());
        auction.setTotalBids(auction.getTotalBids() + 1);
        auctionRepository.save(auction);
        
        return savedBid;
    }
    
    // Get auction by item ID
    public Optional<Auction> getAuctionByItemId(Long itemId) {
        return auctionRepository.findByItemId(itemId);
    }
    
    // Get bid history for an item
    public List<Bid> getBidHistory(Long itemId) {
        return bidRepository.findByItemIdOrderByBidTimeDesc(itemId);
    }
    
    // Get highest bid for an item
    public Optional<Bid> getHighestBid(Long itemId) {
        return bidRepository.findHighestBidForItem(itemId);
    }
    
    // Get user's bids
    public List<Bid> getUserBids(Long bidderId) {
        return bidRepository.findByBidderIdOrderByBidTimeDesc(bidderId);
    }
    
    // Check if user has bid on item
    public boolean hasUserBidOnItem(Long itemId, Long bidderId) {
        return bidRepository.existsByItemIdAndBidderId(itemId, bidderId);
    }
    
    // End auction
    @Transactional
    public Auction endAuction(Long itemId) throws Exception {
        Optional<Auction> auctionOptional = auctionRepository.findByItemId(itemId);
        if (auctionOptional.isEmpty()) {
            throw new Exception("Auction not found");
        }
        
        Auction auction = auctionOptional.get();
        auction.setStatus("ENDED");
        
        // Mark winning bid
        if (auction.getWinningBidId() != null) {
            Optional<Bid> winningBid = bidRepository.findById(auction.getWinningBidId());
            if (winningBid.isPresent()) {
                Bid bid = winningBid.get();
                bid.setStatus("WINNING");
                bidRepository.save(bid);
            }
        }
        
        return auctionRepository.save(auction);
    }
    
    // Get active auctions
    public List<Auction> getActiveAuctions() {
        return auctionRepository.findByStatusOrderByEndTimeAsc("ACTIVE");
    }
    
    // Get auctions ending soon (next hour)
    public List<Auction> getAuctionsEndingSoon() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime oneHourLater = now.plusHours(1);
        return auctionRepository.findAuctionsEndingSoon(now, oneHourLater);
    }
    
    // Process expired auctions (background task)
    @Transactional
    public void processExpiredAuctions() {
        List<Auction> expiredAuctions = auctionRepository.findExpiredAuctions(LocalDateTime.now());
        
        for (Auction auction : expiredAuctions) {
            try {
                endAuction(auction.getItemId());
            } catch (Exception e) {
                System.err.println("Error ending auction for item " + auction.getItemId() + ": " + e.getMessage());
            }
        }
    }
    
    // Get auction statistics
    public long getTotalBidsForItem(Long itemId) {
        return bidRepository.countByItemId(itemId);
    }
    
    // Get seller's auctions
    public List<Auction> getSellerAuctions(Long sellerId) {
        return auctionRepository.findBySellerIdOrderByStartTimeDesc(sellerId);
    }
    
    // Calculate time remaining for auction
    public long getTimeRemaining(Long itemId) {
        Optional<Auction> auction = auctionRepository.findByItemId(itemId);
        return auction.map(Auction::getTimeRemaining).orElse(0L);
    }
}