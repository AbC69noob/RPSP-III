package com.project.Project.controller;

import com.project.Project.model.Terms;
import com.project.Project.repository.TermsRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/terms")
public class TermsController {

    private final TermsRepository repo;

    public TermsController(TermsRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<Terms> getAll() {
        return repo.findAll();
    }

    @PostMapping
    public Terms create(@RequestBody Terms term) {
        return repo.save(term);
    }
}
