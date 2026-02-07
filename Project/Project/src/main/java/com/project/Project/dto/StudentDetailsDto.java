package com.project.Project.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data

@NoArgsConstructor
public class StudentDetailsDto {
    private String rollNo;
    private String programName;
    private String batchName;

    public StudentDetailsDto(String rollNo, String programName, String batchName) {
        this.rollNo = rollNo;
        this.programName = programName;
        this.batchName = batchName;
    }

    public String getRollNo() {
        return rollNo;
    }

    public void setRollNo(String rollNo) {
        this.rollNo = rollNo;
    }

    public String getProgramName() {
        return programName;
    }

    public void setProgramName(String programName) {
        this.programName = programName;
    }

    public String getBatchName() {
        return batchName;
    }

    public void setBatchName(String batchName) {
        this.batchName = batchName;
    }
}
