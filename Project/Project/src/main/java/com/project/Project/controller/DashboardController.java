package com.project.Project.controller;

import com.project.Project.dto.DashboardUserDTO;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/dashboard")
public class DashboardController {

    @GetMapping("/me")
    public DashboardUserDTO getCurrentUser(Authentication authentication) {

        String username = authentication.getName();

        List<String> roles = authentication.getAuthorities()
                .stream()
                .map(GrantedAuthority::getAuthority)
                .toList();

        return new DashboardUserDTO(
                username,
                username + "@example.com", // replace with DB email later
                roles
        );
    }
}
