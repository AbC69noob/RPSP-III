package com.project.Project.dto;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

public class StudentMarksDto {

    private Long studentId;
    private String studentName;
    private Long rollNo;
    private Map<String, Map<String, BigDecimal>> marks = new HashMap<>(); // SubjectName -> { "obtained": X, "full": Y,
                                                                          // "pass": Z }
    private BigDecimal totalObtained = BigDecimal.ZERO;
    private BigDecimal totalFull = BigDecimal.ZERO;

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

    public Map<String, Map<String, BigDecimal>> getMarks() {
        return marks;
    }

    public BigDecimal getTotalObtained() {
        return totalObtained;
    }

    public BigDecimal getTotalFull() {
        return totalFull;
    }

    public void addMark(String subjectName, BigDecimal obtained, Integer full, Integer pass) {
        Map<String, BigDecimal> details = new HashMap<>();
        details.put("obtained", obtained);
        details.put("full", BigDecimal.valueOf(full));
        details.put("pass", BigDecimal.valueOf(pass));
        this.marks.put(subjectName, details);

        if (obtained != null) {
            this.totalObtained = this.totalObtained.add(obtained);
        }
        this.totalFull = this.totalFull.add(BigDecimal.valueOf(full));
    }
}
