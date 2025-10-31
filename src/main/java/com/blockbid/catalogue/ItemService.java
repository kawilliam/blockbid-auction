package com.blockbid.catalogue;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.blockbid.user.User;
import com.blockbid.user.UserRepository;

@Service
public class ItemService {
	
	@Autowired
	private ItemRepository itemRepository;
	
	@Autowired
	private UserRepository userRepository;
	
	public Item createItem(Item item, Long sellerId) {
		
		User seller = userRepository.findById(sellerId)
				.orElseThrow(() -> new RuntimeException("Seller not found"));
		
		item.setSeller(seller);
		
		item.setAuctionType("Forward");
		
		item.setStatus(AuctionStatus.ACTIVE);
		
		item.setCurrentPrice(item.getStartingPrice());
		
		return itemRepository.save(item);
	}
	
	public List<Item> getAllActiveItems() {
		return itemRepository.findByStatusOrderByCreatedAtDesc(AuctionStatus.ACTIVE);
	}
	
	public List<Item> searchItems(String keyword) {
		if (keyword == null || keyword.trim().isEmpty()) {
			return getAllActiveItems();
		}
		return itemRepository.searchByKeyword(keyword.trim(), AuctionStatus.ACTIVE);
	}
}
