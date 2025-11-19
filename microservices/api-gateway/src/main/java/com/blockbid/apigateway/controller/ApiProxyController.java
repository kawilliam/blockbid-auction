package com.blockbid.apigateway.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
public class ApiProxyController {

    @Autowired
    private WebClient.Builder webClientBuilder;

    // User Service Proxy
    @RequestMapping("/api/users/**")
    public ResponseEntity<?> proxyUserService(HttpServletRequest request, @RequestBody(required = false) Map<String, Object> body) {
        String path = request.getRequestURI().replace("/api/users", "");
        if (path.isEmpty()) path = "/";
        
        return proxyRequest("http://localhost:8081" + path, request.getMethod(), body);
    }

    // Item Service Proxy  
    @RequestMapping("/api/items/**")
    public ResponseEntity<?> proxyItemService(HttpServletRequest request, @RequestBody(required = false) Map<String, Object> body) {
        String path = request.getRequestURI().replace("/api/items", "");
        if (path.isEmpty()) path = "/";
        
        return proxyRequest("http://localhost:8082/items" + path, request.getMethod(), body);
    }

    // Auction Service Proxy
    @RequestMapping("/api/auctions/**")
    public ResponseEntity<?> proxyAuctionService(HttpServletRequest request, @RequestBody(required = false) Map<String, Object> body) {
        String path = request.getRequestURI().replace("/api/auctions", "");
        if (path.isEmpty()) path = "/";
        
        return proxyRequest("http://localhost:8083/auctions" + path, request.getMethod(), body);
    }

    // Payment Service Proxy
    @RequestMapping("/api/payments/**")
    public ResponseEntity<?> proxyPaymentService(HttpServletRequest request, @RequestBody(required = false) Map<String, Object> body) {
        String path = request.getRequestURI().replace("/api/payments", "");
        if (path.isEmpty()) path = "/";
        
        return proxyRequest("http://localhost:8084/payments" + path, request.getMethod(), body);
    }

    // Blockchain Service Proxy
    @RequestMapping("/api/blockchain/**")
    public ResponseEntity<?> proxyBlockchainService(HttpServletRequest request, @RequestBody(required = false) Map<String, Object> body) {
        String path = request.getRequestURI().replace("/api/blockchain", "");
        if (path.isEmpty()) path = "/";
        
        return proxyRequest("http://localhost:8085" + path, request.getMethod(), body);
    }

    private ResponseEntity<?> proxyRequest(String url, String method, Map<String, Object> body) {
        try {
            WebClient webClient = webClientBuilder.build();
            
            Mono<ResponseEntity<Object>> response;
            
            switch (method.toUpperCase()) {
                case "GET":
                    response = webClient.get()
                        .uri(url)
                        .retrieve()
                        .toEntity(Object.class);
                    break;
                case "POST":
                    response = webClient.post()
                        .uri(url)
                        .bodyValue(body != null ? body : Map.of())
                        .retrieve()
                        .toEntity(Object.class);
                    break;
                case "PUT":
                    response = webClient.put()
                        .uri(url)
                        .bodyValue(body != null ? body : Map.of())
                        .retrieve()
                        .toEntity(Object.class);
                    break;
                case "DELETE":
                    response = webClient.delete()
                        .uri(url)
                        .retrieve()
                        .toEntity(Object.class);
                    break;
                default:
                    return ResponseEntity.badRequest().body("Unsupported method: " + method);
            }
            
            return response.block();
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error proxying request: " + e.getMessage());
        }
    }
}