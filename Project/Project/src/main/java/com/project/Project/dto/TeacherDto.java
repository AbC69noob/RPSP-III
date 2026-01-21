package com.project.Project.dto;

import com.project.Project.model.Gender;

public class TeacherDto {

    private Long id;
    private String name;
    private String employeeId;
    private String email;
    private Gender gender;

    // ===== Constructor =====
    public TeacherDto(Long id, String name, String employeeId, String email, Gender gender) {
        this.id = id;
        this.name = name;
        this.employeeId = employeeId;
        this.email = email;
        this.gender = gender;
    }

    // ===== Getters & Setters =====
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public Gender getGender() { return gender; }
    public void setGender(Gender gender) { this.gender = gender; }
}
