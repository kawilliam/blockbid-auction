package com.blockbid.apigateway.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.http.ResponseEntity;
import java.util.HashMap;
import java.util.Map;

@Controller
public class FrontendController {

    @GetMapping("/")
    public String index() {
        return "index";
    }

    @GetMapping("/catalogue.html")
    public String catalogue() {
        return "catalogue";
    }

    @GetMapping("/bidding.html")
    public String bidding() {
        return "bidding";
    }

    @GetMapping("/payment.html")
    public String payment() {
        return "payment";
    }

    @GetMapping("/receipt.html")
    public String receipt() {
        return "receipt";
    }

    @GetMapping("/seller.html")
    public String seller() {
        return "seller";
    }
    
    @GetMapping("/my-bids.html")
    public String myBids() {
        return "my-bids";
    }

    @GetMapping("/my-listings.html")
    public String myListings() {
        return "my-listings";
    }
    
    @GetMapping("/health")
    @ResponseBody
    public ResponseEntity<?> healthCheck() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "api-gateway");
        response.put("role", "Frontend & Request Routing");
        return ResponseEntity.ok(response);
    }
}