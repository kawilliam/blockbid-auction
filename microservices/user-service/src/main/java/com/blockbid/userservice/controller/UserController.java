package com.blockbid.userservice.controller;

import com.blockbid.userservice.config.JwtUtils;
import com.blockbid.userservice.entity.User;
import com.blockbid.userservice.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/")
@CrossOrigin(origins = "*")
public class UserController {
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private JwtUtils jwtUtils;
    
    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@RequestBody Map<String, String> request) {
        try {
            User user = new User(
                request.get("username"),
                request.get("password"),
                request.get("firstName"),
                request.get("lastName"),
                request.get("email"),
                request.get("address")
            );
            
            User savedUser = userService.registerUser(user);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "User registered successfully");
            response.put("userId", savedUser.getId());
            response.put("username", savedUser.getUsername());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody Map<String, String> request) {
        try {
            String username = request.get("username");
            String password = request.get("password");
            
            User user = userService.authenticateUser(username, password);
            String token = jwtUtils.generateJwtToken(user.getUsername(), user.getId());
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Login successful");
            response.put("token", token);
            response.put("userId", user.getId());
            response.put("username", user.getUsername());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @GetMapping("/users/{id}")
    public ResponseEntity<?> getUser(@PathVariable Long id, 
                                   @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            // Validate JWT token
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Authorization header required");
                return ResponseEntity.status(401).body(error);
            }
            
            String token = authHeader.substring(7);
            if (!jwtUtils.validateJwtToken(token)) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Invalid token");
                return ResponseEntity.status(401).body(error);
            }
            
            Optional<User> userOptional = userService.findById(id);
            if (userOptional.isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "User not found");
                return ResponseEntity.notFound().build();
            }
            
            User user = userOptional.get();
            
            // Return user data (excluding password)
            Map<String, Object> response = new HashMap<>();
            response.put("id", user.getId());
            response.put("username", user.getUsername());
            response.put("firstName", user.getFirstName());
            response.put("lastName", user.getLastName());
            response.put("email", user.getEmail());
            response.put("address", user.getAddress());
            response.put("createdAt", user.getCreatedAt());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @PostMapping("/validate-token")
    public ResponseEntity<?> validateToken(@RequestHeader("Authorization") String authHeader) {
        try {
            if (!authHeader.startsWith("Bearer ")) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Invalid authorization format");
                return ResponseEntity.status(401).body(error);
            }
            
            String token = authHeader.substring(7);
            if (!jwtUtils.validateJwtToken(token)) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Invalid or expired token");
                return ResponseEntity.status(401).body(error);
            }
            
            String username = jwtUtils.getUsernameFromJwtToken(token);
            Long userId = jwtUtils.getUserIdFromJwtToken(token);
            
            Map<String, Object> response = new HashMap<>();
            response.put("valid", true);
            response.put("username", username);
            response.put("userId", userId);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Token validation failed");
            return ResponseEntity.status(401).body(error);
        }
    }
}