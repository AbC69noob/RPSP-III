package com.project.Project.controller;

import com.project.Project.model.Students;
import com.project.Project.repository.StudentsRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/students")
public class StudentsController {

    private final StudentsRepository repo;

    public StudentsController(StudentsRepository repo) {
        this.repo = repo;
    }

    // ================= GET ALL STUDENTS =================
    @GetMapping
    public ResponseEntity<List<Students>> getAllStudents() {
        return ResponseEntity.ok(repo.findAll());
    }

    @GetMapping("/batches")
    public ResponseEntity<List<String>> getBatches() {
        return ResponseEntity.ok(repo.findDistinctBatches());
    }

    @GetMapping("/filter")
    public ResponseEntity<List<Students>> getFilteredStudents(
            @RequestParam String batch,
            @RequestParam Long programId,
            @RequestParam Integer semester) {
        return ResponseEntity.ok(repo.findByBatchAndProgramIdAndSemester(batch, programId, semester));
    }

    // ================= GET STUDENT BY ID =================
    @GetMapping("/{id}")
    public ResponseEntity<Students> getById(@PathVariable Long id) {
        Students student = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        return ResponseEntity.ok(student);
    }

    // ================= UPDATE STUDENT PROFILE =================
    @PutMapping("/{id}")
    public ResponseEntity<Students> updateStudent(
            @PathVariable Long id,
            @RequestBody Students updated) {
        Students student = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        // Update all allowed fields
        student.setName(updated.getName());
        student.setRollNo(updated.getRollNo());
        student.setBatch(updated.getBatch());
        student.setSemester(updated.getSemester());
        student.setProgram(updated.getProgram());
        student.setPermanentAddress(updated.getPermanentAddress());
        student.setTemporaryAddress(updated.getTemporaryAddress());
        student.setGender(updated.getGender());
        student.setDob(updated.getDob());

        Students saved = repo.save(student);
        return ResponseEntity.ok(saved);
    }
}
