package com.blockbid.user;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.hateoas.EntityModel;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.
*;
import org.springframework.hateoas.EntityModel;

@RestController
@RequestMapping("/api/users")
public class UserController {
	
	@Autowired
	private UserService userService;
	
	@PostMapping("/signup")
	public ResponseEntity<?> signup(@RequestBody User user) {
		try {
			User registeredUser = userService.registerUser(user);
			
			EntityModel<User> resource = EntityModel.of(registeredUser);
			
			resource.add(linkTo(methodOn(UserController.class).getUser(registeredUser.getId()))
					.withRel("profile"));
			
			resource.add(linkTo(methodOn(UserController.class).getUser(registeredUser.getId()))
					.withRel("search-items")
					.withHref("/api/items/search"));
			
			resource.add(linkTo(methodOn(UserController.class).signup(null))
					.withSelfRel());
			
			return ResponseEntity.ok(resource);
		} catch (Exception e) {
			return ResponseEntity.badRequest().body(e.getMessage());
		}
	}
	
	@GetMapping("/{id}")
	public ResponseEntity<User> getUser(@PathVariable Long id) {
		return ResponseEntity.ok(new User());
	}
}
