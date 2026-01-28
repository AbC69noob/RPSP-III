package com.project.Project.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "course_batches", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "program_id", "batch_year" })
})
public class CourseBatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "program_id")
    @JsonIgnore // Ignore when sending JSON
    private Programs program;

    @Column(name = "batch_year", nullable = false)
    private Integer batchYear;

    @Column(name = "start_year")
    private Integer startYear;

    @Column(name = "end_year")
    private Integer endYear;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.ACTIVE;

    @Column(name = "remarks")
    private String remarks;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "courseBatch")
    private List<Subjects> subjects;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public enum Status {
        ACTIVE,
        COMPLETED
    }

    // ===== Getters & Setters =====
    public Long getId() {
        return id;
    }

    public List<Subjects> getSubjects() {
        return subjects;
    }

    public void setSubjects(List<Subjects> subjects) {
        this.subjects = subjects;
    }

    public Programs getProgram() {
        return program;
    }

    public void setProgram(Programs program) {
        this.program = program;
    }

    public Integer getBatchYear() {
        return batchYear;
    }

    public void setBatchYear(Integer batchYear) {
        this.batchYear = batchYear;
    }

    public Integer getStartYear() {
        return startYear;
    }

    public void setStartYear(Integer startYear) {
        this.startYear = startYear;
    }

    public Integer getEndYear() {
        return endYear;
    }

    public void setEndYear(Integer endYear) {
        this.endYear = endYear;
    }

    public Status getStatus() {
        return status;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

}
