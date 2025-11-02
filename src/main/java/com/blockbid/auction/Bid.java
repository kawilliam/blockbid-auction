package com.blockbid.auction;

import jakarta.persistence.*;
import java.time.LocalDateTime;

import com.blockbid.catalogue.Item;
import com.blockbid.user.User;

@Entity
@Table(name = "bids")
public class Bid {
	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
	
	@ManyToOne
	@JoinColumn(name = "user_id", nullable = false)
	private User bidder;
	
	@ManyToOne
	@JoinColumn(name = "item_id", nullable = false)
	private Item item;

	private Double amount;
	
	private LocalDateTime bidTime;
	
	@PrePersist
	protected void onCreate() {
		bidTime = LocalDateTime.now();
	}
	
	public Bid() {}
	
	public Bid(User bidder, Item item, Double amount) {
		this.bidder = bidder;
		this.item = item;
		this.amount = amount;
	}
	
	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public User getBidder() {
		return bidder;
	}

	public void setBidder(User bidder) {
		this.bidder = bidder;
	}

	public Item getItem() {
		return item;
	}

	public void setItem(Item item) {
		this.item = item;
	}

	public Double getAmount() {
		return amount;
	}

	public void setAmount(Double amount) {
		this.amount = amount;
	}

	public LocalDateTime getBidTime() {
		return bidTime;
	}

	public void setBidTime(LocalDateTime bidTime) {
		this.bidTime = bidTime;
	}
}
