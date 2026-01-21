package com.project.Project.model;

import jakarta.persistence.*;

@Entity
@Table(name = "teacher_subjects")
public class Teacher_subjects {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "teacher_id", nullable = false)
    private Teachers teacher;

    @ManyToOne
    @JoinColumn(name = "subject_id", nullable = false)
    private Subjects subject;

    private String studentBatch;

    @ManyToOne
    @JoinColumn(name = "student_program_id")
    private Programs studentProgram;

    private Integer studentSemester;

    /* Getters and Setters */

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Teachers getTeacher() {
        return teacher;
    }

    public void setTeacher(Teachers teacher) {
        this.teacher = teacher;
    }

    public Subjects getSubject() {
        return subject;
    }

    public void setSubject(Subjects subject) {
        this.subject = subject;
    }

    public String getStudentBatch() {
        return studentBatch;
    }

    public void setStudentBatch(String studentBatch) {
        this.studentBatch = studentBatch;
    }

    public Programs getStudentProgram() {
        return studentProgram;
    }

    public void setStudentProgram(Programs studentProgram) {
        this.studentProgram = studentProgram;
    }

    public Integer getStudentSemester() {
        return studentSemester;
    }

    public void setStudentSemester(Integer studentSemester) {
        this.studentSemester = studentSemester;
    }
}
