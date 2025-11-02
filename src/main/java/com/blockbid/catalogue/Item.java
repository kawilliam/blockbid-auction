package com.blockbid.catalogue;

import com.blockbid.user.User;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "items")
public class Item {
	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
	
	private String title;
	
	@Column(length = 1000)
	private String description;
	
	private Double startingPrice, currentPrice;
	
	private String auctionType;
	
	private LocalDateTime auctionEndTime;
	
	@Enumerated(EnumType.STRING)
	private AuctionStatus status;
	
	@ManyToOne
	@JoinColumn(name = "seller_id", nullable = false)
	private User seller;
	
	private LocalDateTime createdAt;
	
	@PrePersist
	protected void ocCreate() {
		createdAt = LocalDateTime.now();
		if (currentPrice == null) {
			currentPrice = startingPrice;
		}
		if (status == null) {
			status = AuctionStatus.ACTIVE;
		}
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getTitle() {
		return title;
	}

	public void setTitle(String title) {
		this.title = title;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public Double getStartingPrice() {
		return startingPrice;
	}

	public void setStartingPrice(Double startingPrice) {
		this.startingPrice = startingPrice;
	}

	public Double getCurrentPrice() {
		return currentPrice;
	}

	public void setCurrentPrice(Double currentPrice) {
		this.currentPrice = currentPrice;
	}

	public String getAuctionType() {
		return auctionType;
	}

	public void setAuctionType(String auctionType) {
		this.auctionType = auctionType;
	}

	public LocalDateTime getAuctionEndTime() {
		return auctionEndTime;
	}

	public void setAuctionEndTime(LocalDateTime auctionEndTime) {
		this.auctionEndTime = auctionEndTime;
	}

	public AuctionStatus getStatus() {
		return status;
	}

	public void setStatus(AuctionStatus status) {
		this.status = status;
	}

	public User getSeller() {
		return seller;
	}

	public void setSeller(User seller) {
		this.seller = seller;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(LocalDateTime createdAt) {
		this.createdAt = createdAt;
	}
	
}

