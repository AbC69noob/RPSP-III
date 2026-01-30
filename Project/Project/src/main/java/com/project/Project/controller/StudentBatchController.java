package com.project.Project.controller;

import com.project.Project.dto.StudentBatchRequest;
import com.project.Project.model.CourseBatch;
import com.project.Project.model.StudentBatch;
import com.project.Project.repository.CourseBatchRepository;
import com.project.Project.repository.StudentBatchRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/student-batches")
public class StudentBatchController {

    @Autowired
    private StudentBatchRepository studentBatchRepository;

    @Autowired
    private CourseBatchRepository courseBatchRepository;

    @GetMapping
    public List<StudentBatch> getAll() {
        return studentBatchRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<StudentBatch> create(@RequestBody StudentBatchRequest request) {
        CourseBatch cb = courseBatchRepository.findById(request.getCourseBatchId())
                .orElseThrow(() -> new RuntimeException("Course Batch not found"));

        StudentBatch sb = new StudentBatch();
        sb.setName(request.getName());
        sb.setCourseBatch(cb);
        return ResponseEntity.ok(studentBatchRepository.save(sb));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        studentBatchRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
