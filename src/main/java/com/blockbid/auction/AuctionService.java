package com.blockbid.auction;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.blockbid.catalogue.Item;
import com.blockbid.catalogue.ItemRepository;
import com.blockbid.user.User;
import com.blockbid.user.UserRepository;
import com.blockbid.catalogue.AuctionStatus;


@Service
public class AuctionService {

	@Autowired
	private BidRepository bidRepository;
	
	@Autowired
	private ItemRepository itemRepository;
	
	@Autowired
	private UserRepository userRepository;
	
	@Transactional
	public Bid placeBid(Long itemId, Long bidderId, Double bidAmount) {
		
		Item item = itemRepository.findById(itemId)
				.orElseThrow(() -> new RuntimeException("Item not found"));
		
		User bidder = userRepository.findById(bidderId)
				.orElseThrow(() -> new RuntimeException("User not found"));
		
		if (item.getStatus() != AuctionStatus.ACTIVE) {
			throw new RuntimeException("Auction has ended");
		}
		
		if (item.getAuctionEndTime().isBefore(LocalDateTime.now())) {
			throw new RuntimeException(("Auction time has expired"));
		}
		
		if (bidAmount <= item.getCurrentPrice()) {
			throw new RuntimeException("Bid must be higher than current price of " + item.getCurrentPrice());
		}
		
		Bid bid = new Bid(bidder, item, bidAmount);
		bidRepository.save(bid);
		
		item.setCurrentPrice(bidAmount);
		itemRepository.save(item);
		
		return bid;
	}
	
	public List<Bid> getBidsForItem(Long itemId) {
		return bidRepository.findByItemIdOrderByAmountDesc(itemId);
	}
	
	public Bid getHighestBid(Long itemId) {
		return bidRepository.findHighestBidForItem(itemId).orElse(null);
	}
}
