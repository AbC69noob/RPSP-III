package com.project.Project.controller;

import com.project.Project.model.CrTerm;
import com.project.Project.repository.CrTermRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/cr-terms")
public class CrTermController {

    private final CrTermRepository crTermRepository;

    public CrTermController(CrTermRepository crTermRepository) {
        this.crTermRepository = crTermRepository;
    }

    @GetMapping
    public ResponseEntity<List<CrTerm>> getAllCrTerms() {
        return ResponseEntity.ok(crTermRepository.findAll());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('admin')")
    public ResponseEntity<CrTerm> createCrTerm(@RequestBody CrTerm request) {
        if (request.getName() == null || request.getName().isEmpty()) {
            throw new IllegalArgumentException("Term name cannot be empty");
        }
        
        // Check if exists
        if (crTermRepository.findByName(request.getName()).isPresent()) {
            throw new IllegalArgumentException("Term with this name already exists");
        }

        CrTerm crTerm = new CrTerm(request.getName());
        CrTerm saved = crTermRepository.save(crTerm);
        return ResponseEntity.ok(saved);
    }
}
