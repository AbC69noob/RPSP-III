package com.project.Project.dto;

public class ProfileDto {

    private Long id; // <-- new
    private String name;
    private String username;
    private String role;
    private Long teacherId; // <-- new

    public ProfileDto(Long id, String name, String username, String role) {
        this.id = id;
        this.name = name;
        this.username = username;
        this.role = role;
    }

    public ProfileDto(Long id, String name, String username, String role, Long teacherId) {
        this.id = id;
        this.name = name;
        this.username = username;
        this.role = role;
        this.teacherId = teacherId;
    }

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

    public Long getTeacherId() {
        return teacherId;
    }
}
