package com.blockbid.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class WebController {
	
	@GetMapping("/")
	public String index() {
		return "index";
	}
	
	@GetMapping("/catalogue.html")
	public String catalogue() {
		return "catalogue";
	}
	
	@GetMapping("/test")
	public String test() {
	    return "index";  // Should show index page
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
