package com.project.Project.dto;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

public class StudentMarksDto {

    private Long studentId;
    private String studentName;
    private Long rollNo;
    private Map<String, BigDecimal> marks = new HashMap<>(); // SubjectName -> ObtainedMarks

    public StudentMarksDto(Long studentId, String studentName, Long rollNo) {
        this.studentId = studentId;
        this.studentName = studentName;
        this.rollNo = rollNo;
    }

    public Long getStudentId() {
        return studentId;
    }

    public String getStudentName() {
        return studentName;
    }

    public Long getRollNo() {
        return rollNo;
    }

    public Map<String, BigDecimal> getMarks() {
        return marks;
    }

    public void addMark(String subjectName, BigDecimal obtainedMarks) {
        this.marks.put(subjectName, obtainedMarks);
    }
}
