package com.project.Project.model;

import jakarta.persistence.*;

@Entity
@Table(name = "semesters")
public class Semester {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name; // e.g., "Semester 1", "Semester 2"

    @Column(name = "semester_number", nullable = false, unique = true)
    private Integer semesterNumber; // 1, 2, ..., 8

    public Semester() {
    }

    public Semester(String name, Integer semesterNumber) {
        this.name = name;
        this.semesterNumber = semesterNumber;
    }

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
}
