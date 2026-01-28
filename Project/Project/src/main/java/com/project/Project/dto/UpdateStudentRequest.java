package com.project.Project.dto;

import com.project.Project.model.Gender;
import java.util.Date;

public class UpdateStudentRequest {

    private Long userId;
    private String name;
    private Long rollNo;
    private Integer semester;
    private Long courseBatchId;
    private Long studentBatchId; // Helper for new grouping
    private String permanentAddress;
    private String temporaryAddress;
    private Gender gender;
    private Date dob;

    // getters

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Long getRollNo() {
        return rollNo;
    }

    public void setRollNo(Long rollNo) {
        this.rollNo = rollNo;
    }

    public Integer getSemester() {
        return semester;
    }

    public void setSemester(Integer semester) {
        this.semester = semester;
    }

    public Long getCourseBatchId() {
        return courseBatchId;
    }

    public void setCourseBatchId(Long courseBatchId) {
        this.courseBatchId = courseBatchId;
    }

    public Long getStudentBatchId() {
        return studentBatchId;
    }

    public void setStudentBatchId(Long studentBatchId) {
        this.studentBatchId = studentBatchId;
    }

    public String getPermanentAddress() {
        return permanentAddress;
    }

    public void setPermanentAddress(String permanentAddress) {
        this.permanentAddress = permanentAddress;
    }

    public String getTemporaryAddress() {
        return temporaryAddress;
    }

    public void setTemporaryAddress(String temporaryAddress) {
        this.temporaryAddress = temporaryAddress;
    }

    public Gender getGender() {
        return gender;
    }

    public void setGender(Gender gender) {
        this.gender = gender;
    }

    public Date getDob() {
        return dob;
    }

    public void setDob(Date dob) {
        this.dob = dob;
    }
}
