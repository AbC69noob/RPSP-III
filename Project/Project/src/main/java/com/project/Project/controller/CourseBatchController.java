package com.project.Project.controller;

import com.project.Project.model.CourseBatch;
import com.project.Project.repository.CourseBatchRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/course-batches")
public class CourseBatchController {

    private final CourseBatchRepository courseBatchRepository;

    public CourseBatchController(CourseBatchRepository courseBatchRepository) {
        this.courseBatchRepository = courseBatchRepository;
    }

    // CREATE
    @PostMapping
    public CourseBatch create(@RequestBody CourseBatch courseBatch) {
        return courseBatchRepository.save(courseBatch);
    }

    // READ ALL
    @GetMapping
    public List<CourseBatch> getAll() {
        return courseBatchRepository.findAll();
    }

    // READ BY ID
    @GetMapping("/{id}")
    public CourseBatch getById(@PathVariable Long id) {
        return courseBatchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("CourseBatch not found"));
    }

    // UPDATE
    @PutMapping("/{id}")
    public CourseBatch update(@PathVariable Long id, @RequestBody CourseBatch updatedBatch) {
        CourseBatch batch = courseBatchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("CourseBatch not found"));

        batch.setStartYear(updatedBatch.getStartYear());
        batch.setDescription(updatedBatch.getDescription());

        return courseBatchRepository.save(batch);
    }

    // DELETE
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        courseBatchRepository.deleteById(id);
    }
}
