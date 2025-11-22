package com.blockbid.auctionservice.validation;

import java.util.HashMap;
import java.util.Map;

public class BidValidator {
    
	public static Map<String, String> validateBid(Map<String, Object> request, Double currentPrice) {
	    Map<String, String> errors = new HashMap<>();
	    
	    // Validate bidderId
	    if (request.get("bidderId") == null) {
	        errors.put("field", "bidderId");
	        errors.put("message", "Bidder ID is required");
	        return errors;
	    }
	    
	    // Validate amount
	    if (request.get("amount") == null) {
	        errors.put("field", "amount");
	        errors.put("message", "Bid amount is required");
	        return errors;
	    }
	    
	    try {
	        Object amountObj = request.get("amount");
	        Double bidAmount;
	        
	        // Handle both Integer and Double from JSON
	        if (amountObj instanceof Number) {
	            bidAmount = ((Number) amountObj).doubleValue();
	        } else {
	            bidAmount = Double.valueOf(amountObj.toString());
	        }
	        
	        if (Double.isNaN(bidAmount) || Double.isInfinite(bidAmount)) {
	            errors.put("field", "amount");
	            errors.put("message", "Bid amount must be a valid number");
	            return errors;
	        }
	        
	        if (bidAmount <= 0) {
	            errors.put("field", "amount");
	            errors.put("message", "Bid amount must be greater than $0");
	            return errors;
	        }
	        
	        Double minBid = currentPrice + 0.01;
	        if (bidAmount < minBid) {
	            errors.put("field", "amount");
	            errors.put("message", String.format("Bid must be at least $%.2f", minBid));
	            return errors;
	        }
	        
	        if (bidAmount > currentPrice * 100) {
	            errors.put("field", "amount");
	            errors.put("message", "Bid amount seems unreasonably high. Please verify.");
	            return errors;
	        }
	        
	        // Check decimal places
	        if (bidAmount * 100 != Math.floor(bidAmount * 100)) {
	            errors.put("field", "amount");
	            errors.put("message", "Bid amount can only have up to 2 decimal places");
	            return errors;
	        }
	        
	    } catch (NumberFormatException e) {
	        errors.put("field", "amount");
	        errors.put("message", "Bid amount must be a valid number");
	        return errors;
	    }
	    
	    return errors;
	}
}