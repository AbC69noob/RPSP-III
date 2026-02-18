package com.example.rpsp.model;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class StudentMarksDto {
    private Long studentId;
    private String studentName;
    private String rollNo;
    private Map<String, Map<String, Double>> marks; // SubjectName -> Details
    private Double totalObtained;
    private Double totalFullBody;

    public String getStudentName() {
        return studentName;
    }

    public String getRollNo() {
        return rollNo;
    }

    // Helper to convert Map to List for RecyclerView
    public List<MarkDto> getMarksList() {
        List<MarkDto> list = new ArrayList<>();
        if (marks != null) {
            for (Map.Entry<String, Map<String, Double>> entry : marks.entrySet()) {
                String subject = entry.getKey();
                Map<String, Double> details = entry.getValue();
                list.add(new MarkDto(subject, details.get("obtained"), details.get("full"), details.get("pass")));
            }
        }
        return list;
    }

    public static class MarkDto {
        private String subjectName;
        private Double obtainedMarks;
        private Double fullMarks;
        private Double passMarks;

        public MarkDto(String subjectName, Double obtainedMarks, Double fullMarks, Double passMarks) {
            this.subjectName = subjectName;
            this.obtainedMarks = obtainedMarks;
            this.fullMarks = fullMarks;
            this.passMarks = passMarks;
        }

        public String getSubjectName() {
            return subjectName;
        }

        public Double getObtainedMarks() {
            return obtainedMarks;
        }

        public Double getFullMarks() {
            return fullMarks;
        }

        public Double getPassMarks() {
            return passMarks;
        }
    }
}
