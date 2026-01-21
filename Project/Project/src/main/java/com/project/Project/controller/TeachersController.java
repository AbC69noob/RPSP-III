package com.project.Project.controller;

import com.project.Project.dto.TeacherDto;
import com.project.Project.model.Teachers;
import com.project.Project.repository.TeachersRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/teachers")
public class TeachersController {

    private final TeachersRepository repo;

    public TeachersController(TeachersRepository repo) {
        this.repo = repo;
    }

    // ================= GET ALL TEACHERS =================
    @GetMapping
    @PreAuthorize("hasAnyAuthority('admin', 'teacher')")
    public List<TeacherDto> getAll() {
        return repo.findAll()
                .stream()
                .map(teacher -> new TeacherDto(
                        teacher.getId(),
                        teacher.getName() != null ? teacher.getName() : teacher.getUser().getUsername(),
                        teacher.getEmployeeId(),
                        teacher.getUser() != null ? teacher.getUser().getEmail() : null,
                        teacher.getGender()))
                .collect(Collectors.toList());
    }

    // ================= GET TEACHER BY ID =================
    @GetMapping("/{id}")
    public ResponseEntity<Teachers> getById(@PathVariable Long id) {
        Teachers teacher = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));
        return ResponseEntity.ok(teacher);
    }

    // ================= UPDATE TEACHER PROFILE =================
    @PutMapping("/{id}")
    public ResponseEntity<Teachers> updateProfile(
            @PathVariable Long id,
            @RequestBody Teachers updated) {
        Teachers teacher = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));

        // Update all allowed fields
        teacher.setName(updated.getName());
        teacher.setEmail(updated.getEmail());
        teacher.setEmployeeId(updated.getEmployeeId());
        teacher.setQualifications(updated.getQualifications());
        teacher.setContactNo(updated.getContactNo());
        teacher.setPermanentAddress(updated.getPermanentAddress());
        teacher.setTemporaryAddress(updated.getTemporaryAddress());
        teacher.setGender(updated.getGender());
        teacher.setDob(updated.getDob());
        teacher.setStatus(updated.getStatus());

        Teachers saved = repo.save(teacher);
        return ResponseEntity.ok(saved);
    }
}
