package com.blockbid.paymentservice.controller;

import com.blockbid.paymentservice.entity.Payment;
import com.blockbid.paymentservice.service.PaymentService;
import com.blockbid.paymentservice.validation.PaymentValidator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/")
@CrossOrigin(origins = "*")
public class PaymentController {
    
    @Autowired
    private PaymentService paymentService;
    
    // Process payment (UC5 - Payment functionality)
    @PostMapping("/process")
    public ResponseEntity<?> processPayment(@RequestBody Map<String, Object> request) {
        try {
            // Validate input
            Map<String, String> validationErrors = PaymentValidator.validatePayment(request);
            if (!validationErrors.isEmpty()) {
                return ResponseEntity.badRequest().body(validationErrors);
            }
            
            Payment payment = paymentService.processPayment(request);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Payment processed successfully");
            response.put("paymentId", payment.getId());
            response.put("transactionId", payment.getTransactionId());
            response.put("status", payment.getStatus());
            response.put("totalAmount", payment.getTotalAmount());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            
            // Handle specific payment errors
            if (e.getMessage().contains("Payment declined")) {
                error.put("message", "Payment was declined. Please check your card details.");
            } else if (e.getMessage().contains("Insufficient funds")) {
                error.put("message", "Insufficient funds. Please use a different payment method.");
            } else if (e.getMessage().contains("not the winner")) {
                error.put("message", "You are not the winner of this auction");
            } else {
                error.put("message", "Payment processing failed: " + e.getMessage());
            }
            
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // Get payment details
    @GetMapping("/{id}")
    public ResponseEntity<?> getPayment(@PathVariable Long id) {
        try {
            Optional<Payment> paymentOptional = paymentService.getPaymentById(id);
            
            if (paymentOptional.isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Payment not found");
                return ResponseEntity.notFound().build();
            }
            
            return ResponseEntity.ok(paymentOptional.get());
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // Get payment receipt (UC6 - Receipt functionality)
    @GetMapping("/{id}/receipt")
    public ResponseEntity<?> getPaymentReceipt(@PathVariable Long id) {
        try {
            Map<String, Object> receipt = paymentService.getPaymentReceipt(id);
            return ResponseEntity.ok(receipt);
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // Get payment by transaction ID
    @GetMapping("/transaction/{transactionId}")
    public ResponseEntity<?> getPaymentByTransactionId(@PathVariable String transactionId) {
        try {
            Optional<Payment> paymentOptional = paymentService.getPaymentByTransactionId(transactionId);
            
            if (paymentOptional.isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Payment not found");
                return ResponseEntity.notFound().build();
            }
            
            return ResponseEntity.ok(paymentOptional.get());
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // Get user's payment history
    @GetMapping("/users/{userId}/payments")
    public ResponseEntity<?> getUserPayments(@PathVariable Long userId) {
        try {
            List<Payment> payments = paymentService.getUserPayments(userId);
            return ResponseEntity.ok(payments);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // Health check endpoint
    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "payment-service");
        return ResponseEntity.ok(response);
    }
}