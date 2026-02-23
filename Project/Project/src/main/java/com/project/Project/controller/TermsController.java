package com.project.Project.controller;

import com.project.Project.model.Terms;
import com.project.Project.repository.TermsRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/terms")
public class TermsController {

    private final TermsRepository repo;
    private final com.project.Project.repository.CrTermRepository crTermRepo;

    public TermsController(TermsRepository repo, com.project.Project.repository.CrTermRepository crTermRepo) {
        this.repo = repo;
        this.crTermRepo = crTermRepo;
    }

    @GetMapping
    public List<Terms> getAll() {
        return repo.findAll();
    }

    @PostMapping
    public Terms create(@RequestBody Terms term) {
        if (term.getCrTerm() != null && term.getCrTerm().getId() != null) {
            com.project.Project.model.CrTerm crTerm = crTermRepo.findById(term.getCrTerm().getId())
                    .orElseThrow(() -> new RuntimeException("CrTerm not found"));
            term.setCrTerm(crTerm);
        }
        term.setCreatedAt(new java.sql.Timestamp(System.currentTimeMillis()));
        return repo.save(term);
    }

    @PutMapping("/{id}")
    public Terms update(@PathVariable Long id, @RequestBody Terms termDetails) {
        Terms term = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Term not found with id: " + id));
        
        term.setName(termDetails.getName());
        term.setStartDate(termDetails.getStartDate());
        term.setEndDate(termDetails.getEndDate());
        term.setRemarks(termDetails.getRemarks());
        
        if (termDetails.getCrTerm() != null && termDetails.getCrTerm().getId() != null) {
            com.project.Project.model.CrTerm crTerm = crTermRepo.findById(termDetails.getCrTerm().getId())
                    .orElseThrow(() -> new RuntimeException("CrTerm not found"));
            term.setCrTerm(crTerm);
        }
        
        return repo.save(term);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        repo.deleteById(id);
    }
}
