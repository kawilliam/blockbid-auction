package com.blockbid.userservice.validation;

import java.util.HashMap;
import java.util.Map;
import java.util.regex.Pattern;

public class UserValidator {
    
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final Pattern USERNAME_PATTERN = Pattern.compile("^[a-zA-Z0-9_]+$");
    private static final Pattern NAME_PATTERN = Pattern.compile("^[a-zA-Z\\s'-]+$");
    
    public static Map<String, String> validateSignup(Map<String, String> request) {
        Map<String, String> errors = new HashMap<>();
        
        // Validate username
        String username = request.get("username");
        if (username == null || username.trim().isEmpty()) {
            errors.put("field", "username");
            errors.put("message", "Username is required");
            return errors;
        }
        if (username.length() < 3) {
            errors.put("field", "username");
            errors.put("message", "Username must be at least 3 characters");
            return errors;
        }
        if (username.length() > 20) {
            errors.put("field", "username");
            errors.put("message", "Username cannot exceed 20 characters");
            return errors;
        }
        if (!USERNAME_PATTERN.matcher(username).matches()) {
            errors.put("field", "username");
            errors.put("message", "Username can only contain letters, numbers, and underscores");
            return errors;
        }
        
        // Validate email
        String email = request.get("email");
        if (email == null || email.trim().isEmpty()) {
            errors.put("field", "email");
            errors.put("message", "Email is required");
            return errors;
        }
        if (!EMAIL_PATTERN.matcher(email).matches()) {
            errors.put("field", "email");
            errors.put("message", "Please enter a valid email address");
            return errors;
        }
        
        // Validate password
        String password = request.get("password");
        if (password == null || password.isEmpty()) {
            errors.put("field", "password");
            errors.put("message", "Password is required");
            return errors;
        }
        if (password.length() < 6) {
            errors.put("field", "password");
            errors.put("message", "Password must be at least 6 characters");
            return errors;
        }
        if (password.length() > 50) {
            errors.put("field", "password");
            errors.put("message", "Password cannot exceed 50 characters");
            return errors;
        }
        if (!password.matches(".*[A-Za-z].*")) {
            errors.put("field", "password");
            errors.put("message", "Password must contain at least one letter");
            return errors;
        }
        if (!password.matches(".*[0-9].*")) {
            errors.put("field", "password");
            errors.put("message", "Password must contain at least one number");
            return errors;
        }
        
        // Validate first name
        String firstName = request.get("firstName");
        if (firstName == null || firstName.trim().isEmpty()) {
            errors.put("field", "firstName");
            errors.put("message", "First name is required");
            return errors;
        }
        if (firstName.length() < 2) {
            errors.put("field", "firstName");
            errors.put("message", "First name must be at least 2 characters");
            return errors;
        }
        if (firstName.length() > 50) {
            errors.put("field", "firstName");
            errors.put("message", "First name cannot exceed 50 characters");
            return errors;
        }
        if (!NAME_PATTERN.matcher(firstName).matches()) {
            errors.put("field", "firstName");
            errors.put("message", "First name can only contain letters, spaces, hyphens, and apostrophes");
            return errors;
        }
        
        // Validate last name
        String lastName = request.get("lastName");
        if (lastName == null || lastName.trim().isEmpty()) {
            errors.put("field", "lastName");
            errors.put("message", "Last name is required");
            return errors;
        }
        if (lastName.length() < 2) {
            errors.put("field", "lastName");
            errors.put("message", "Last name must be at least 2 characters");
            return errors;
        }
        if (lastName.length() > 50) {
            errors.put("field", "lastName");
            errors.put("message", "Last name cannot exceed 50 characters");
            return errors;
        }
        if (!NAME_PATTERN.matcher(lastName).matches()) {
            errors.put("field", "lastName");
            errors.put("message", "Last name can only contain letters, spaces, hyphens, and apostrophes");
            return errors;
        }
        
        // Validate address
        String address = request.get("address");
        if (address == null || address.trim().isEmpty()) {
            errors.put("field", "address");
            errors.put("message", "Address is required");
            return errors;
        }
        if (address.length() < 10) {
            errors.put("field", "address");
            errors.put("message", "Please enter a complete address (at least 10 characters)");
            return errors;
        }
        if (address.length() > 200) {
            errors.put("field", "address");
            errors.put("message", "Address is too long (max 200 characters)");
            return errors;
        }
        
        return errors;
    }
    
    public static Map<String, String> validateLogin(Map<String, String> request) {
        Map<String, String> errors = new HashMap<>();
        
        String username = request.get("username");
        if (username == null || username.trim().isEmpty()) {
            errors.put("field", "username");
            errors.put("message", "Username is required");
            return errors;
        }
        
        String password = request.get("password");
        if (password == null || password.isEmpty()) {
            errors.put("field", "password");
            errors.put("message", "Password is required");
            return errors;
        }
        
        return errors;
    }
}