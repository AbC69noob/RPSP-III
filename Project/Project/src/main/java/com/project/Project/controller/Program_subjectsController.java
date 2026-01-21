package com.project.Project.controller;

import com.project.Project.model.Program_subjects;
import com.project.Project.repository.ProgramSubjectsRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/program-subjects")
public class Program_subjectsController {

    private final ProgramSubjectsRepository repo;

    public Program_subjectsController(ProgramSubjectsRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<Program_subjects> getAll() {
        return repo.findAll();
    }

    @PostMapping
    public Program_subjects create(@RequestBody Program_subjects ps) {
        return repo.save(ps);
    }
}
