package com.blockbid.auction;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.hateoas.EntityModel;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.blockbid.catalogue.Item;

import java.util.List;
import java.util.Map;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.*;

@RestController
@RequestMapping("/api/auctions")
public class AuctionController {
	
	@Autowired
	private AuctionService auctionService;
	
	@PostMapping("/items/{itemId}/bid")
	public ResponseEntity<?> placeBid(
			@PathVariable Long itemId,
			@RequestParam Long bidderId,
			@RequestParam Double amount) {
		try {
			Bid bid = auctionService.placeBid(itemId, bidderId, amount);
			
			EntityModel<Bid> resource = EntityModel.of(bid);
			resource.add(linkTo(methodOn(AuctionController.class).getBidsForItem(itemId))
					.withRel("all-bids"));
			resource.add(linkTo(methodOn(AuctionController.class).getHighestBid(itemId))
					.withRel("highest-bid"));
			
			return ResponseEntity.ok(resource);
		} catch (Exception e) {
			return ResponseEntity.badRequest().body(e.getMessage());
		}
	}
	
	@GetMapping("/items/{itemId}/bids")
	public ResponseEntity<List<Bid>> getBidsForItem(@PathVariable Long itemId) {
		List<Bid> bids = auctionService.getBidsForItem(itemId);
		return ResponseEntity.ok(bids);
	}
	
	@GetMapping("/items/{itemId}/highest-bid")
	public ResponseEntity<?> getHighestBid(@PathVariable Long itemId) {
		Bid highestBid = auctionService.getHighestBid(itemId);
		if (highestBid == null) {
			return ResponseEntity.ok("No bids yet");
		}
		return ResponseEntity.ok(highestBid);
	}
	
	@PostMapping("/items/{itemId}/end")
	public ResponseEntity<?> endAuction(@PathVariable Long itemId) {
		try {
			Item endedItem = auctionService.endAuction(itemId);
			
			Bid highestBid = auctionService.getHighestBid(itemId);
			
			return ResponseEntity.ok(Map.of(
					"message", "Auction ended successfully",
					"item", endedItem,
					"winningBid", highestBid,
					"winner", highestBid.getBidder().getUsername()
			));
		} catch (Exception e) {
			return ResponseEntity.badRequest().body(e.getMessage());
		}
	}
	
	@GetMapping("/items/{itemId}/winner")
	public ResponseEntity<?> checkWinner(@PathVariable Long itemId, @RequestParam Long userId) {
		boolean isWinner = auctionService.isWinner(itemId, userId);
		return ResponseEntity.ok(Map.of("isWinner", isWinner));
	}
}
