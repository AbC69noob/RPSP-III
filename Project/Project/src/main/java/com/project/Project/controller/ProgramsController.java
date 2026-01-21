package com.project.Project.controller;

import com.project.Project.dto.ProgramRequest;
import com.project.Project.model.Faculties;
import com.project.Project.model.Programs;
import com.project.Project.repository.FacultiesRepository;
import com.project.Project.repository.ProgramsRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/programs")
public class ProgramsController {

    private final ProgramsRepository repo;
    private final FacultiesRepository facultiesRepo;

    public ProgramsController(ProgramsRepository repo, FacultiesRepository facultiesRepo) {
        this.repo = repo;
        this.facultiesRepo = facultiesRepo;
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('admin', 'teacher')")
    public List<Programs> getAll() {
        return repo.findAll();
    }

    @GetMapping("/faculty/{facultyId}")
    @PreAuthorize("hasAnyAuthority('admin', 'teacher')")
    public List<Programs> getByFaculty(@PathVariable Long facultyId) {
        return repo.findByFacultyId(facultyId);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('admin')")
    public ResponseEntity<Programs> create(@RequestBody ProgramRequest request) {
        Faculties faculty = facultiesRepo.findById(request.getFacultyId())
                .orElseThrow(() -> new RuntimeException("Faculty not found"));

        Programs program = new Programs();
        program.setName(request.getName());
        program.setDescription(request.getDescription());
        program.setFaculty(faculty);
        program.setCreatedAt(new java.sql.Timestamp(System.currentTimeMillis()));

        Programs saved = repo.save(program);
        return ResponseEntity.ok(saved);
    }
}
