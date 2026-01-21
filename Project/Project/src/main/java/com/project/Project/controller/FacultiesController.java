package com.project.Project.controller;

import com.project.Project.model.Faculties;
import com.project.Project.repository.FacultiesRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/faculties")
public class FacultiesController {

    private final FacultiesRepository repo;

    public FacultiesController(FacultiesRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<Faculties> getAll() {
        return repo.findAll();
    }

    @PostMapping
    public Faculties create(@RequestBody Faculties faculty) {
        return repo.save(faculty);
    }
}
