package com.project.Project.dto;

import java.util.List;

public class BulkSemesterUpdateRequest {
    private List<Long> studentIds;
    private Long targetSemesterId;

    public List<Long> getStudentIds() {
        return studentIds;
    }

    public void setStudentIds(List<Long> studentIds) {
        this.studentIds = studentIds;
    }

    public Long getTargetSemesterId() {
        return targetSemesterId;
    }

    public void setTargetSemesterId(Long targetSemesterId) {
        this.targetSemesterId = targetSemesterId;
    }
}
