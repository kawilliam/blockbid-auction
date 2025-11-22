package com.blockbid.itemservice.validation;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

public class ItemValidator {
    
    public static Map<String, String> validateItem(Map<String, Object> request) {
        Map<String, String> errors = new HashMap<>();
        
        // Validate name
        String name = (String) request.get("name");
        if (name == null || name.trim().isEmpty()) {
            errors.put("field", "name");
            errors.put("message", "Item name is required");
            return errors;
        }
        if (name.trim().length() < 3) {
            errors.put("field", "name");
            errors.put("message", "Item name must be at least 3 characters");
            return errors;
        }
        if (name.trim().length() > 100) {
            errors.put("field", "name");
            errors.put("message", "Item name cannot exceed 100 characters");
            return errors;
        }
        
        // Validate description
        String description = (String) request.get("description");
        if (description == null || description.trim().isEmpty()) {
            errors.put("field", "description");
            errors.put("message", "Description is required");
            return errors;
        }
        if (description.trim().length() < 10) {
            errors.put("field", "description");
            errors.put("message", "Description must be at least 10 characters");
            return errors;
        }
        if (description.trim().length() > 500) {
            errors.put("field", "description");
            errors.put("message", "Description cannot exceed 500 characters");
            return errors;
        }
        
        // Validate starting price
        if (request.get("startingPrice") == null) {
            errors.put("field", "startingPrice");
            errors.put("message", "Starting price is required");
            return errors;
        }
        
        try {
            Double startingPrice = Double.valueOf(request.get("startingPrice").toString());
            if (startingPrice <= 0) {
                errors.put("field", "startingPrice");
                errors.put("message", "Starting price must be greater than $0");
                return errors;
            }
            if (startingPrice > 1000000) {
                errors.put("field", "startingPrice");
                errors.put("message", "Starting price cannot exceed $1,000,000");
                return errors;
            }
            
            // Check decimal places
            if (startingPrice * 100 != Math.floor(startingPrice * 100)) {
                errors.put("field", "startingPrice");
                errors.put("message", "Price can only have up to 2 decimal places");
                return errors;
            }
            
            // Validate reserve price if provided
            if (request.get("reservePrice") != null) {
                Double reservePrice = Double.valueOf(request.get("reservePrice").toString());
                if (reservePrice < startingPrice) {
                    errors.put("field", "reservePrice");
                    errors.put("message", String.format("Reserve price must be at least $%.2f (starting price)", startingPrice));
                    return errors;
                }
            }
        } catch (NumberFormatException e) {
            errors.put("field", "startingPrice");
            errors.put("message", "Starting price must be a valid number");
            return errors;
        }
        
        // Validate category
        String category = (String) request.get("category");
        if (category == null || category.trim().isEmpty()) {
            errors.put("field", "category");
            errors.put("message", "Please select a category");
            return errors;
        }
        
        // Validate condition
        String condition = (String) request.get("condition");
        if (condition == null || condition.trim().isEmpty()) {
            errors.put("field", "condition");
            errors.put("message", "Please select item condition");
            return errors;
        }
        
        // Validate end time
        String endTimeStr = (String) request.get("endTime");
        if (endTimeStr == null || endTimeStr.trim().isEmpty()) {
            errors.put("field", "endTime");
            errors.put("message", "Auction end time is required");
            return errors;
        }
        
        try {
            LocalDateTime endTime = LocalDateTime.parse(endTimeStr);
            if (endTime.isBefore(LocalDateTime.now())) {
                errors.put("field", "endTime");
                errors.put("message", "Auction end time must be in the future");
                return errors;
            }
        } catch (Exception e) {
            errors.put("field", "endTime");
            errors.put("message", "Invalid auction end time format");
            return errors;
        }
        
        // Validate seller ID
        if (request.get("sellerId") == null) {
            errors.put("field", "sellerId");
            errors.put("message", "Seller ID is required");
            return errors;
        }
        
        return errors; // Empty if all valid
    }
}