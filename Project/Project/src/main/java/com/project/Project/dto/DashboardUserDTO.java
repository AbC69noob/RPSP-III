package com.project.Project.dto;

import java.util.List;

public class DashboardUserDTO {

    private String username;
    private String email;
    private List<String> roles;

    public DashboardUserDTO(String username, String email, List<String> roles) {
        this.username = username;
        this.email = email;
        this.roles = roles;
    }

    public String getUsername() {
        return username;
    }

    public String getEmail() {
        return email;
    }

    public List<String> getRoles() {
        return roles;
    }
    // getters
}
