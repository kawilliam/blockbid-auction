package com.blockbid.paymentservice.service;

import com.blockbid.paymentservice.entity.Order;
import com.blockbid.paymentservice.entity.Payment;
import com.blockbid.paymentservice.repository.OrderRepository;
import com.blockbid.paymentservice.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class PaymentService {
    
    @Autowired
    private PaymentRepository paymentRepository;
    
    @Autowired
    private OrderRepository orderRepository;
    
    // Process payment (UC5 - Payment functionality)
    @Transactional
    public Payment processPayment(Map<String, Object> paymentData) throws Exception {
        // Extract payment data
        Long itemId = Long.valueOf(paymentData.get("itemId").toString());
        Long userId = Long.valueOf(paymentData.get("userId").toString());
        Double totalAmount = Double.valueOf(paymentData.get("totalAmount").toString());
        String shippingType = (String) paymentData.get("shippingType");
        
        @SuppressWarnings("unchecked")
        Map<String, Object> paymentDetails = (Map<String, Object>) paymentData.get("paymentDetails");
        
        // Validate payment data
        validatePaymentData(paymentData);
        
        // Check if payment already exists for this item and user
        if (paymentRepository.existsByItemIdAndUserId(itemId, userId)) {
            throw new Exception("Payment already processed for this item");
        }
        
        // Create payment record
        Payment payment = new Payment();
        payment.setItemId(itemId);
        payment.setUserId(userId);
        payment.setTotalAmount(totalAmount);
        
        // Calculate shipping cost
        Double shippingCost = "expedited".equals(shippingType) ? 15.0 : 0.0;
        payment.setShippingCost(shippingCost);
        payment.setItemPrice(totalAmount - shippingCost);
        payment.setShippingType(shippingType);
        
        // Set shipping address (would normally come from user service)
        payment.setShippingAddress("123 Default Address"); // Placeholder
        
        // Process payment details (securely store only necessary info)
        String cardNumber = (String) paymentDetails.get("cardNumber");
        payment.setCardLastFour(getLastFour(cardNumber));
        payment.setCardholderName((String) paymentDetails.get("cardholderName"));
        
        // Simulate payment processing
        boolean paymentSuccessful = simulatePaymentProcessing(paymentDetails);
        
        if (paymentSuccessful) {
            payment.complete();
        } else {
            payment.fail();
            paymentRepository.save(payment);
            throw new Exception("Payment processing failed");
        }
        
        // Save payment
        Payment savedPayment = paymentRepository.save(payment);
        
        // Create order for receipt (UC6)
        createOrderFromPayment(savedPayment, paymentData);
        
        return savedPayment;
    }
    
    // Create order from payment (UC6 - Receipt generation)
    private void createOrderFromPayment(Payment payment, Map<String, Object> paymentData) {
        Order order = new Order();
        order.setPaymentId(payment.getId());
        order.setItemId(payment.getItemId());
        order.setUserId(payment.getUserId());
        
        // These would normally come from Item Service
        order.setItemName("Auction Item #" + payment.getItemId());
        order.setItemDescription("Item purchased through auction");
        
        // Calculate estimated delivery
        LocalDateTime estimatedDelivery = LocalDateTime.now();
        if ("expedited".equals(payment.getShippingType())) {
            estimatedDelivery = estimatedDelivery.plusDays(3);
        } else {
            estimatedDelivery = estimatedDelivery.plusDays(7);
        }
        order.setEstimatedDelivery(estimatedDelivery);
        
        // Generate tracking number
        order.setTrackingNumber("TRK" + System.currentTimeMillis());
        
        orderRepository.save(order);
    }
    
    // Validate payment data
    private void validatePaymentData(Map<String, Object> paymentData) throws Exception {
        @SuppressWarnings("unchecked")
        Map<String, Object> paymentDetails = (Map<String, Object>) paymentData.get("paymentDetails");
        
        String cardNumber = (String) paymentDetails.get("cardNumber");
        String expiryDate = (String) paymentDetails.get("expiryDate");
        String cvv = (String) paymentDetails.get("cvv");
        String cardholderName = (String) paymentDetails.get("cardholderName");
        
        if (cardNumber == null || cardNumber.replaceAll("\\s", "").length() < 13) {
            throw new Exception("Invalid card number");
        }
        
        if (expiryDate == null || !expiryDate.matches("\\d{2}/\\d{2}")) {
            throw new Exception("Invalid expiry date");
        }
        
        if (cvv == null || cvv.length() < 3) {
            throw new Exception("Invalid CVV");
        }
        
        if (cardholderName == null || cardholderName.trim().length() < 2) {
            throw new Exception("Invalid cardholder name");
        }
        
        // Validate expiry date is not in the past
        String[] dateParts = expiryDate.split("/");
        int month = Integer.parseInt(dateParts[0]);
        int year = Integer.parseInt(dateParts[1]) + 2000;
        
        LocalDateTime now = LocalDateTime.now();
        if (year < now.getYear() || (year == now.getYear() && month < now.getMonthValue())) {
            throw new Exception("Card has expired");
        }
    }
    
    // Simulate payment processing
    private boolean simulatePaymentProcessing(Map<String, Object> paymentDetails) {
        // In a real system, this would integrate with payment gateway
        // For demo purposes, always return true except for test failure cases
        
        String cardNumber = (String) paymentDetails.get("cardNumber");
        
        // Simulate failure for certain test card numbers
        if (cardNumber != null && cardNumber.contains("4444")) {
            return false; // Test failure case
        }
        
        // Simulate processing time
        try {
            Thread.sleep(1000); // 1 second processing delay
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        return true; // Success
    }
    
    // Get last four digits of card
    private String getLastFour(String cardNumber) {
        if (cardNumber == null) return "****";
        String cleanCard = cardNumber.replaceAll("\\s", "");
        if (cleanCard.length() >= 4) {
            return cleanCard.substring(cleanCard.length() - 4);
        }
        return "****";
    }
    
    // Get payment by ID
    public Optional<Payment> getPaymentById(Long id) {
        return paymentRepository.findById(id);
    }
    
    // Get payment by transaction ID
    public Optional<Payment> getPaymentByTransactionId(String transactionId) {
        return paymentRepository.findByTransactionId(transactionId);
    }
    
    // Get user's payments
    public List<Payment> getUserPayments(Long userId) {
        return paymentRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }
    
    // Get payment receipt data (UC6)
    public Map<String, Object> getPaymentReceipt(Long paymentId) throws Exception {
        Optional<Payment> paymentOptional = paymentRepository.findById(paymentId);
        if (paymentOptional.isEmpty()) {
            throw new Exception("Payment not found");
        }
        
        Payment payment = paymentOptional.get();
        Optional<Order> orderOptional = orderRepository.findByPaymentId(paymentId);
        
        // Build receipt data
        Map<String, Object> receipt = new java.util.HashMap<>();
        receipt.put("id", payment.getId());
        receipt.put("transactionId", payment.getTransactionId());
        receipt.put("userId", payment.getUserId());
        receipt.put("totalAmount", payment.getTotalAmount());
        receipt.put("itemPrice", payment.getItemPrice());
        receipt.put("shippingCost", payment.getShippingCost());
        receipt.put("shippingType", payment.getShippingType());
        receipt.put("shippingAddress", payment.getShippingAddress());
        receipt.put("status", payment.getStatus());
        receipt.put("timestamp", payment.getCreatedAt());
        
        // Payment method info (masked)
        Map<String, Object> paymentMethod = new java.util.HashMap<>();
        paymentMethod.put("cardLastFour", payment.getCardLastFour());
        paymentMethod.put("cardholderName", payment.getCardholderName());
        paymentMethod.put("paymentMethod", payment.getPaymentMethod());
        receipt.put("paymentDetails", paymentMethod);
        
        // Order info
        if (orderOptional.isPresent()) {
            Order order = orderOptional.get();
            Map<String, Object> orderInfo = new java.util.HashMap<>();
            orderInfo.put("orderNumber", order.getOrderNumber());
            orderInfo.put("status", order.getStatus());
            orderInfo.put("estimatedDelivery", order.getEstimatedDelivery());
            orderInfo.put("trackingNumber", order.getTrackingNumber());
            receipt.put("order", orderInfo);
        }
        
        // Item info (placeholder - would normally fetch from Item Service)
        Map<String, Object> item = new java.util.HashMap<>();
        item.put("name", "Auction Item #" + payment.getItemId());
        item.put("description", "Item purchased through auction");
        item.put("currentPrice", payment.getItemPrice());
        receipt.put("item", item);
        
        return receipt;
    }
    
    // Get all payments (admin function)
    public List<Payment> getAllPayments() {
        return paymentRepository.findAll();
    }
}