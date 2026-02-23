package com.project.Project.controller;

import com.project.Project.model.Semester;
import com.project.Project.repository.SemesterRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/semesters")
public class SemesterController {

    private final SemesterRepository semesterRepository;

    public SemesterController(SemesterRepository semesterRepository) {
        this.semesterRepository = semesterRepository;
    }

    @GetMapping
    public ResponseEntity<List<Semester>> getAllSemesters() {
        return ResponseEntity.ok(semesterRepository.findAll());
    }

    @PostMapping("/init")
    @PreAuthorize("hasAuthority('admin')")
    public ResponseEntity<String> initSemesters() {
        for (int i = 1; i <= 8; i++) {
            if (semesterRepository.findBySemesterNumber(i).isEmpty()) {
                Semester sem = new Semester("Semester " + i, i);
                semesterRepository.save(sem);
            }
        }
        return ResponseEntity.ok("Semesters 1-8 initialized");
    }
}
