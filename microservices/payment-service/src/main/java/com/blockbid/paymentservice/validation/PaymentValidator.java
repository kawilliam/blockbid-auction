package com.blockbid.paymentservice.validation;

import java.util.HashMap;
import java.util.Map;
import java.util.regex.Pattern;

public class PaymentValidator {
    
    private static final Pattern CARD_NUMBER_PATTERN = Pattern.compile("^\\d{13,19}$");
    private static final Pattern CVV_PATTERN = Pattern.compile("^\\d{3,4}$");
    private static final Pattern EXPIRY_PATTERN = Pattern.compile("^\\d{2}/\\d{2}$");
    
    public static Map<String, String> validatePayment(Map<String, Object> request) {
        Map<String, String> errors = new HashMap<>();
        
        // Validate itemId
        if (request.get("itemId") == null) {
            errors.put("field", "itemId");
            errors.put("message", "Item ID is required");
            return errors;
        }
        
        // Validate userId
        if (request.get("userId") == null) {
            errors.put("field", "userId");
            errors.put("message", "User ID is required");
            return errors;
        }
        
        // Validate payment details
        Object paymentDetailsObj = request.get("paymentDetails");
        if (paymentDetailsObj == null) {
            errors.put("message", "Payment details are required");
            return errors;
        }
        
        @SuppressWarnings("unchecked")
        Map<String, Object> paymentDetails = (Map<String, Object>) paymentDetailsObj;
        
        // Validate card number
        String cardNumber = (String) paymentDetails.get("cardNumber");
        if (cardNumber == null || cardNumber.trim().isEmpty()) {
            errors.put("field", "cardNumber");
            errors.put("message", "Card number is required");
            return errors;
        }
        
        String cleanedCard = cardNumber.replaceAll("\\s", "");
        if (!CARD_NUMBER_PATTERN.matcher(cleanedCard).matches()) {
            errors.put("field", "cardNumber");
            errors.put("message", "Invalid card number format");
            return errors;
        }
        
        if (!luhnCheck(cleanedCard)) {
            errors.put("field", "cardNumber");
            errors.put("message", "Invalid card number (failed checksum)");
            return errors;
        }
        
        // Validate expiry date
        String expiryDate = (String) paymentDetails.get("expiryDate");
        if (expiryDate == null || expiryDate.trim().isEmpty()) {
            errors.put("field", "expiryDate");
            errors.put("message", "Expiry date is required");
            return errors;
        }
        
        if (!EXPIRY_PATTERN.matcher(expiryDate).matches()) {
            errors.put("field", "expiryDate");
            errors.put("message", "Expiry date must be in MM/YY format");
            return errors;
        }
        
        // Check if card is expired
        String[] parts = expiryDate.split("/");
        int month = Integer.parseInt(parts[0]);
        int year = Integer.parseInt(parts[1]) + 2000;
        
        java.time.LocalDate now = java.time.LocalDate.now();
        java.time.LocalDate cardExpiry = java.time.LocalDate.of(year, month, 1).plusMonths(1).minusDays(1);
        
        if (cardExpiry.isBefore(now)) {
            errors.put("field", "expiryDate");
            errors.put("message", "Card has expired");
            return errors;
        }
        
        // Validate CVV
        String cvv = (String) paymentDetails.get("cvv");
        if (cvv == null || cvv.trim().isEmpty()) {
            errors.put("field", "cvv");
            errors.put("message", "CVV is required");
            return errors;
        }
        
        if (!CVV_PATTERN.matcher(cvv).matches()) {
            errors.put("field", "cvv");
            errors.put("message", "CVV must be 3 or 4 digits");
            return errors;
        }
        
        // Validate cardholder name
        String cardholderName = (String) paymentDetails.get("cardholderName");
        if (cardholderName == null || cardholderName.trim().isEmpty()) {
            errors.put("field", "cardholderName");
            errors.put("message", "Cardholder name is required");
            return errors;
        }
        
        if (cardholderName.trim().length() < 2) {
            errors.put("field", "cardholderName");
            errors.put("message", "Name is too short (minimum 2 characters)");
            return errors;
        }
        
        return errors; // Empty if valid
    }
    
    private static boolean luhnCheck(String cardNumber) {
        int sum = 0;
        boolean alternate = false;
        
        for (int i = cardNumber.length() - 1; i >= 0; i--) {
            int digit = Character.getNumericValue(cardNumber.charAt(i));
            
            if (alternate) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }
            
            sum += digit;
            alternate = !alternate;
        }
        
        return sum % 10 == 0;
    }
}