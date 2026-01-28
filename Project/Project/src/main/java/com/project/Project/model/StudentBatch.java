package com.project.Project.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "student_batches")
public class StudentBatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name; // e.g., "2021 Fall"

    @ManyToOne
    @JoinColumn(name = "course_batch_id")
    private CourseBatch courseBatch;

    @OneToMany(mappedBy = "studentBatch")
    @JsonIgnore
    private List<Students> students;

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

    public List<Students> getStudents() {
        return students;
    }

    public void setStudents(List<Students> students) {
        this.students = students;
    }
}
