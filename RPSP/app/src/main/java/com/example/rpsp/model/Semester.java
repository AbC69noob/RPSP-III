package com.example.rpsp.model;

public class Semester {
    private Long id;
    private String name;
    private Integer semesterNumber;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getSemesterNumber() {
        return semesterNumber;
    }

    public void setSemesterNumber(Integer semesterNumber) {
        this.semesterNumber = semesterNumber;
    }

    @Override
    public String toString() {
        return name; // For Spinner display
    }
}
