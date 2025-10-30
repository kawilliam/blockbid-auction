package com.blockbid.user;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserService {
	
	@Autowired
	private UserRepository userRepository;
	
	public User registerUser(User user) {
		if (userRepository.existsByUsername(user.getUsername())) {
			throw new RuntimeException("Username already exists");
		}
		
		return userRepository.save(user);
	}
	
	public User loginUser(String username, String password) {
		
		User user = userRepository.findByUsername(username)
				.orElseThrow(() -> new RuntimeException("Invalid username or password"));
		
		if (!user.getPassword().equals(password)) {
			throw new RuntimeException("Invalid username or password");
		}
		
		return user;
	}
}
