package com.project.Project.model;

import jakarta.persistence.*;

@Entity
@Table(name = "student_batch")
public class StudentBatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @ManyToOne
    @JoinColumn(name = "course_batch_id", nullable = false)
    private CourseBatch courseBatch;

    // Getters and Setters
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

    public CourseBatch getCourseBatch() {
        return courseBatch;
    }

    public void setCourseBatch(CourseBatch courseBatch) {
        this.courseBatch = courseBatch;
    }
}
