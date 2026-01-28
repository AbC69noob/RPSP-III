package com.project.Project.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.project.Project.model.Role;
import com.project.Project.model.Gender;

public class UserRequest {

    // ================= COMMON FIELDS =================
    private String username;
    private String email;
    private String password;
    private Role role;

    @JsonProperty("permanent_address")
    private String permanentAddress;

    @JsonProperty("temporary_address")
    private String temporaryAddress;
    private Gender gender;
    private String dob; // yyyy-MM-dd

    // ================= TEACHER FIELDS =================
    private String employeeId;
    private String qualifications;
    private String contactNo;

    // ================= STUDENT FIELDS =================
    // ================= STUDENT FIELDS =================
    @JsonProperty("roll_no")
    private Long rollNo;
    private Integer semester;
    private Long courseBatchId; // 🔥 REQUIRED for students
    private String name;
    // 🔥 student full name
    @JsonProperty("program_id") // 🔥 student batch
    private Long programId;

    @JsonProperty("student_batch_id")
    private Long studentBatchId;
    // ================= GETTERS & SETTERS =================

    public String getUsername() {
        return username;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Long getProgramId() {
        return programId;
    }

    public void setProgramId(Long programId) {
        this.programId = programId;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
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

    public String getDob() {
        return dob;
    }

    public void setDob(String dob) {
        this.dob = dob;
    }

    // ---------- Teacher ----------
    public String getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(String employeeId) {
        this.employeeId = employeeId;
    }

    public String getQualifications() {
        return qualifications;
    }

    public void setQualifications(String qualifications) {
        this.qualifications = qualifications;
    }

    public String getContactNo() {
        return contactNo;
    }

    public void setContactNo(String contactNo) {
        this.contactNo = contactNo;
    }

    // ---------- Student ----------
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
}
