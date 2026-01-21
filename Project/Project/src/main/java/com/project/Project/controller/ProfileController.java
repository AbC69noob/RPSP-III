package com.project.Project.controller;

import com.project.Project.dto.ProfileDto;
import com.project.Project.model.Users;
import com.project.Project.repository.UsersRepository;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/profile")
public class ProfileController {

    private final UsersRepository usersRepository;

    public ProfileController(UsersRepository usersRepository) {
        this.usersRepository = usersRepository;
    }

    /**
     * Get logged-in user's profile
     * Username is extracted from JWT (SecurityContext)
     */
    @GetMapping
    public ProfileDto getProfile(Authentication authentication) {

        String username = authentication.getName();

        Users user = usersRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return new ProfileDto(
                user.getId(),
                user.getUsername(),   // display name (change if fullName exists)
                user.getUsername(),
                user.getRole().name()
        );
    }
}
