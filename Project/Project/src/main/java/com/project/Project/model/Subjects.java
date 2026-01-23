package com.project.Project.model;

import jakarta.persistence.*;
import java.sql.Timestamp;

@Entity
@Table(name = "subjects")
public class Subjects {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String code;
    private String name;
    private Integer semester;

    @ManyToOne
    @JoinColumn(name = "program_id")
    private Programs program;

    @Column(name = "full_mark")
    private Integer fullMark;

    @Column(name = "pass_marks")
    private Integer passMarks;

    @Column(name = "created_at")
    private Timestamp createdAt;

    @Column(name = "active")
    private Boolean active = true;

    private String batch;

    /* Getters and Setters */

    public String getBatch() {
        return batch;
    }

    public void setBatch(String batch) {
        this.batch = batch;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getFullMark() {
        return fullMark;
    }

    public void setFullMark(Integer fullMark) {
        this.fullMark = fullMark;
    }

    public Integer getPassMarks() {
        return passMarks;
    }

    public void setPassMarks(Integer passMarks) {
        this.passMarks = passMarks;
    }

    public Timestamp getCreatedAt() {
        return createdAt;
    }

    public Integer getSemester() {
        return semester;
    }

    public void setSemester(Integer semester) {
        this.semester = semester;
    }

    public Programs getProgram() {
        return program;
    }

    public void setProgram(Programs program) {
        this.program = program;
    }

    public void setCreatedAt(Timestamp createdAt) {
        this.createdAt = createdAt;
    }
}
