package com.blockbid.payment;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {
	
	@Autowired
	private PaymentService paymentService;
	
	@PostMapping("/items/{itemId}")
	public ResponseEntity<?> processPayment(
			@PathVariable Long itemId,
			@RequestParam Long userId,
			@RequestBody PaymentRequest paymentRequest) {
		try {
			Payment payment = paymentService.processPayment(itemId, userId, paymentRequest);
			
			return ResponseEntity.ok(Map.of(
					"message", "Payment successful",
	                "paymentId", payment.getId(),
	                "totalPaid", payment.getTotalAmount(),
	                "itemPrice", payment.getItemPrice(),
	                "shippingCost", payment.getShippingCost(),
	                "expeditedShipping", payment.getExpeditedShipping()
					));
		} catch (Exception e) {
			return ResponseEntity.badRequest().body(e.getMessage());
		}
	}
}
