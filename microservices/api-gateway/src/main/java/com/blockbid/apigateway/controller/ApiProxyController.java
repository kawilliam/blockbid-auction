package com.blockbid.apigateway.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
public class ApiProxyController {

    @Autowired
    private WebClient.Builder webClientBuilder;
    
    private final ObjectMapper objectMapper = new ObjectMapper();

    // User Service Proxy
    @RequestMapping("/api/users/**")
    public ResponseEntity<?> proxyUserService(HttpServletRequest request, 
                                             @RequestBody(required = false) Map<String, Object> body,
                                             @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String path = request.getRequestURI().replace("/api/users", "");
        if (path.isEmpty()) path = "/";
        
        return proxyRequest("http://user-service:8081" + path, request.getMethod(), body, null);
    }

    // Item Service Proxy  
    @RequestMapping("/api/items/**")
    public ResponseEntity<?> proxyItemService(HttpServletRequest request, 
                                             @RequestBody(required = false) Map<String, Object> body,
                                             @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String path = request.getRequestURI().replace("/api/items", "");
        if (path.isEmpty()) path = "/";
        
        return proxyRequest("http://item-service:8082" + path, request.getMethod(), body, authHeader);
    }

    // Auction Service Proxy
    @RequestMapping("/api/auctions/**")
    public ResponseEntity<?> proxyAuctionService(HttpServletRequest request, 
                                                @RequestBody(required = false) Map<String, Object> body,
                                                @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String path = request.getRequestURI().replace("/api/auctions", "");
        if (path.isEmpty()) path = "/";
        
        return proxyRequest("http://auction-service:8083" + path, request.getMethod(), body, authHeader);
    }

    // Payment Service Proxy
    @RequestMapping("/api/payments/**")
    public ResponseEntity<?> proxyPaymentService(HttpServletRequest request, 
                                                @RequestBody(required = false) Map<String, Object> body,
                                                @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String path = request.getRequestURI().replace("/api/payments", "");
        if (path.isEmpty()) path = "/";
        
        return proxyRequest("http://payment-service:8084" + path, request.getMethod(), body, authHeader);
    }

    // Blockchain Service Proxy
    @RequestMapping("/api/blockchain/**")
    public ResponseEntity<?> proxyBlockchainService(HttpServletRequest request, 
                                                   @RequestBody(required = false) Map<String, Object> body,
                                                   @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String path = request.getRequestURI().replace("/api/blockchain", "");
        if (path.isEmpty()) path = "/";
        
        return proxyRequest("http://blockchain-service:8085" + path, request.getMethod(), body, authHeader);
    }

    // ===== SINGLE proxyRequest METHOD =====
    private ResponseEntity<?> proxyRequest(String url, String method, Map<String, Object> body, String authHeader) {
        try {
            WebClient webClient = webClientBuilder.build();
            
            Mono<ResponseEntity<Object>> response;
            
            switch (method.toUpperCase()) {
	            case "GET":
	                WebClient.RequestHeadersSpec<?> getSpec = webClient.get().uri(url);
	                if (authHeader != null) {
	                    getSpec = getSpec.header("Authorization", authHeader);
	                }
	                response = getSpec
	                    .retrieve()
	                    .onStatus(status -> status.is4xxClientError() || status.is5xxServerError(),
	                        clientResponse -> clientResponse.bodyToMono(String.class)
	                            .map(errorBody -> new RuntimeException(errorBody)))
	                    .toEntity(Object.class);
	                break;
                    
	            case "POST":
	                WebClient.RequestHeadersSpec<?> postSpec = webClient.post()
	                    .uri(url)
	                    .bodyValue(body != null ? body : new HashMap<>());
	                if (authHeader != null) {
	                    postSpec = postSpec.header("Authorization", authHeader);
	                }
	                response = postSpec
	                    .retrieve()
	                    .onStatus(status -> status.is4xxClientError() || status.is5xxServerError(),
	                        clientResponse -> clientResponse.bodyToMono(String.class)
	                            .map(errorBody -> new RuntimeException(errorBody)))
	                    .toEntity(Object.class);
	                break;
                    
                case "PUT":
                	WebClient.RequestHeadersSpec<?> putSpec = webClient.put()
	                    .uri(url)
	                    .bodyValue(body != null ? body : new HashMap<>());
	                if (authHeader != null) {
	                    putSpec = putSpec.header("Authorization", authHeader);
	                }
	                response = putSpec
	                    .retrieve()
	                    .onStatus(status -> status.is4xxClientError() || status.is5xxServerError(),
	                        clientResponse -> clientResponse.bodyToMono(String.class)
	                            .map(errorBody -> new RuntimeException(errorBody)))
	                    .toEntity(Object.class);
	                break;
                    
                case "DELETE":
                	WebClient.RequestHeadersSpec<?> deleteSpec = webClient.put()
	                    .uri(url)
	                    .bodyValue(body != null ? body : new HashMap<>());
	                if (authHeader != null) {
	                    deleteSpec = deleteSpec.header("Authorization", authHeader);
	                }
	                response = deleteSpec
	                    .retrieve()
	                    .onStatus(status -> status.is4xxClientError() || status.is5xxServerError(),
	                        clientResponse -> clientResponse.bodyToMono(String.class)
	                            .map(errorBody -> new RuntimeException(errorBody)))
	                    .toEntity(Object.class);
	                break;
                    
                default:
                    Map<String, String> error = new HashMap<>();
                    error.put("message", "Unsupported HTTP method: " + method);
                    return ResponseEntity.badRequest().body(error);
            }
            
            return response.block();
            
        } catch (Exception e) {
            // Try to parse downstream service error
            String errorMessage = e.getMessage();
            
            try {
                // If error is JSON, pass it through
                Object parsedError = objectMapper.readValue(errorMessage, Object.class);
                return ResponseEntity.badRequest().body(parsedError);
            } catch (Exception parseError) {
                // If not JSON, create structured error
                Map<String, String> error = new HashMap<>();
                
                if (errorMessage != null) {
                    if (errorMessage.contains("Connection refused")) {
                        error.put("message", "Service temporarily unavailable. Please try again later.");
                    } else if (errorMessage.contains("timeout")) {
                        error.put("message", "Request timeout. Please try again.");
                    } else {
                        error.put("message", "Error processing request: " + errorMessage);
                    }
                } else {
                    error.put("message", "Unknown error occurred");
                }
                
                return ResponseEntity.badRequest().body(error);
            }
        }
    }
}