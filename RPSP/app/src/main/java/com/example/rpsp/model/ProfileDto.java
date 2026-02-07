package com.example.rpsp.model;

import com.google.gson.annotations.SerializedName;

public class ProfileDto {
    private Long id;
    private String name;
    private String username;
    private String role;
    private boolean requiresPasswordChange;

    @SerializedName("studentDetails")
    private StudentDetailsDto studentDetails;

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getUsername() {
        return username;
    }

    public String getRole() {
        return role;
    }

    public boolean isRequiresPasswordChange() {
        return requiresPasswordChange;
    }

    public StudentDetailsDto getStudentDetails() {
        return studentDetails;
    }
}
