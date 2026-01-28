package com.project.Project.controller;

import com.project.Project.model.StudentBatch;
import com.project.Project.repository.StudentBatchRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/student-batches")
@CrossOrigin(origins = "http://localhost:5173")
public class StudentBatchController {

    @Autowired
    private StudentBatchRepository studentBatchRepository;

    @GetMapping
    public List<StudentBatch> getAllBatches() {
        return studentBatchRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<StudentBatch> createBatch(@RequestBody StudentBatch studentBatch) {
        StudentBatch savedBatch = studentBatchRepository.save(studentBatch);
        return ResponseEntity.ok(savedBatch);
    }
}
