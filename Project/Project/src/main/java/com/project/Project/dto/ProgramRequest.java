package com.project.Project.dto;

public class ProgramRequest {
    private String name;
    private String description;
    private Long facultyId;

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public Long getFacultyId() {
        return facultyId;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setFacultyId(Long facultyId) {
        this.facultyId = facultyId;
    }
}
