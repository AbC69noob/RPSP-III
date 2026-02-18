package com.example.rpsp.model;

public class LoginResponse {
    private String token;
    private boolean requiresPasswordChange;
    private Long userId;

    public String getToken() {
        return token;
    }

    public boolean isRequiresPasswordChange() {
        return requiresPasswordChange;
    }

    public Long getUserId() {
        return userId;
    }
}
