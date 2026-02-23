package com.project.Project.dto;

public class StudentProfileDto {

    private String name;
    private Long rollNo;
    private String program;
    private Long semesterId;

    public StudentProfileDto(String name,
            Long rollNo,
            String program,
            Long semesterId) {
        this.name = name;
        this.rollNo = rollNo;
        this.program = program;
        this.semesterId = semesterId;
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

    public Long getSemesterId() {
        return semesterId;
    }
}
