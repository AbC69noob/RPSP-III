package com.project.Project.dto;

public class CourseBatchRequest {

    private Long programId;
    private Integer batchYear;
    private Integer startYear;
    private Integer endYear;
    private String remarks;

    public Long getProgramId() {
        return programId;
    }

    public Integer getBatchYear() {
        return batchYear;
    }

    public Integer getStartYear() {
        return startYear;
    }

    public Integer getEndYear() {
        return endYear;
    }

    public String getRemarks() {
        return remarks;
    }
}
