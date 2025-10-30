package com.blockbid;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BlockbidApplication {
	public static void main(String[] args) {
		SpringApplication.run(BlockbidApplication.class, args);
		System.out.println("\n==========================================");
		System.out.println("BlockBid Auction System Started!");
		System.out.println("Access at: http://localhost:8080");
		System.out.println("==========================================\n");
	}
}