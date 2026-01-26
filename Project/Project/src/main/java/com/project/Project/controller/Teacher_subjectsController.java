package com.project.Project.controller;

import com.project.Project.model.Teacher_subjects;

import com.project.Project.repository.TeacherSubjectsRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/teacher-subjects")
public class Teacher_subjectsController {

    private final TeacherSubjectsRepository repo;

    public Teacher_subjectsController(TeacherSubjectsRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<Teacher_subjects> getAll() {
        return repo.findAll();
    }

    @GetMapping("/teacher/{teacherId}")
    public List<Teacher_subjects> getByTeacher(@PathVariable Long teacherId) {
        return repo.findByTeacherId(teacherId);
    }

    @PostMapping
    public Teacher_subjects create(@RequestBody Teacher_subjects ts) {
        return repo.save(ts);
    }
}
