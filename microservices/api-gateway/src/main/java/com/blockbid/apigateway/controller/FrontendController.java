package com.blockbid.apigateway.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

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
}