package com.project.Project.dto;

public class StudentBatchRequest {
    private String name;
    private Long courseBatchId;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Long getCourseBatchId() {
        return courseBatchId;
    }

    public void setCourseBatchId(Long courseBatchId) {
        this.courseBatchId = courseBatchId;
    }
}
