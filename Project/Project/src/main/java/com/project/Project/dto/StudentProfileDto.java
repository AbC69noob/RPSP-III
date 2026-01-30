package com.project.Project.dto;

public class StudentProfileDto {

    private String name;
    private Long rollNo;
    private String program;
    private Integer semester;

    public StudentProfileDto(String name,
            Long rollNo,
            String program,
            Integer semester) {
        this.name = name;
        this.rollNo = rollNo;
        this.program = program;
        this.semester = semester;
    }

    public String getName() {
        return name;
    }

    public Long getRollNo() {
        return rollNo;
    }

    public String getProgram() {
        return program;
    }

    public Integer getSemester() {
        return semester;
    }
}
