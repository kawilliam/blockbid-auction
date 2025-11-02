package com.blockbid.payment;

import com.blockbid.auction.AuctionService;
import com.blockbid.catalogue.Item;
import com.blockbid.catalogue.ItemRepository;
import com.blockbid.user.User;
import com.blockbid.user.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

public class PaymentService {
	
	@Autowired
	private PaymentRepository paymentRepository;
	
	@Autowired
	private ItemRepository itemRepository;
	
	@Autowired
	private UserRepository userRepository;
	
	@Autowired
	private AuctionService auctionService;
	
	@Transactional
	public Payment processPayment(Long itemId, Long userId, PaymentRequest paymentRequest) {
		
		Item item = itemRepository.findById(itemId)
				.orElseThrow(() -> new RuntimeException("Item not found"));
		
		User buyer = userRepository.findById(userId)
				.orElseThrow(() -> new RuntimeException("User not found"));
		
		if (!auctionService.isWinner(itemId, userId)) {
			throw new RuntimeException("Only the auction winner can pay for this item");
		}
		
		if (paymentRepository.existsByItemId(itemId)) {
			throw new RuntimeException("This item has already been paid for");
		}
		
		Double itemPrice = item.getCurrentPrice();
		Double shippingCost = paymentRequest.getExpeditedShipping() ? 20.0 : 10.0;
		Double totalAmount = itemPrice + shippingCost;
		
		Payment payment = new Payment();
		payment.setItem(item);
		payment.setBuyer(buyer);
		payment.setItemPrice(itemPrice);
		payment.setShippingCost(shippingCost);
		payment.setTotalAmount(totalAmount);
		payment.setExpeditedShipping(paymentRequest.getExpeditedShipping());
		
		payment.setCardNumber(paymentRequest.getCardNumber());
		payment.setNameOnCard(paymentRequest.getNameOnCard());
        payment.setExpirationDate(paymentRequest.getExpirationDate());
        payment.setSecurityCode(paymentRequest.getSecurityCode());
        
        payment.setStatus(PaymentStatus.COMPLETED);
        
        return paymentRepository.save(payment);
	}
}
