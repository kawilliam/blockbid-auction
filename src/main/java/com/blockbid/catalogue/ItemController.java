package com.blockbid.catalogue;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.hateoas.EntityModel;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.*;
import java.util.*;

@RestController
@RequestMapping("/api/items")
public class ItemController {
	
	@Autowired
	private ItemService itemService;
	
	@PostMapping
	public ResponseEntity<?> createItem(@RequestBody Item item, @RequestParam Long sellerId) {
		try {
			Item createdItem = itemService.createItem(item, sellerId);
			
			EntityModel<Item> resource = EntityModel.of(createdItem);
			resource.add(linkTo(methodOn(ItemController.class).getItem(createdItem.getId()))
					.withSelfRel());
			resource.add(linkTo(methodOn(ItemController.class).getAllItems())
					.withRel("all-items"));
			
			return ResponseEntity.ok(resource);
		} catch (Exception e) {
			return ResponseEntity.badRequest().body(e.getMessage());
		}
	}
	
	@GetMapping
	public ResponseEntity<List<Item>> getAllItems() {
		List<Item> items = itemService.getAllActiveItems();
		return ResponseEntity.ok(items);
	}
	
	@GetMapping("/{id}")
	public ResponseEntity<Item> getItem(@PathVariable Long id) {
		return ResponseEntity.ok(new Item());
	}
	
	@GetMapping("/search")
	public ResponseEntity<List<Item>> searchItems(@RequestParam(required = false) String keyword) {
		List<Item> items = itemService.searchItems(keyword);
		return ResponseEntity.ok(items);
	}
}
