package com.project.Project.controller;

import com.project.Project.dto.CourseBatchRequest;
import com.project.Project.model.CourseBatch;
import com.project.Project.model.Programs;
import com.project.Project.repository.CourseBatchRepository;
import com.project.Project.repository.ProgramsRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/course-batches")
public class CourseBatchController {

    private final CourseBatchRepository courseBatchRepository;
    private final ProgramsRepository programRepository;

    public CourseBatchController(
            CourseBatchRepository courseBatchRepository,
            ProgramsRepository programRepository) {
        this.courseBatchRepository = courseBatchRepository;
        this.programRepository = programRepository;
    }

    // 1️⃣ Create Course Batch
    // 1️⃣ Create Course Batch
    @PostMapping
    public ResponseEntity<?> createCourseBatch(@RequestBody CourseBatchRequest request) {

        Programs program = null;
        if (request.getProgramId() != null) {
            program = programRepository.findById(request.getProgramId())
                    .orElseThrow(() -> new RuntimeException("Program not found"));
        }

        if (program != null && courseBatchRepository.existsByProgramIdAndBatchYear(
                request.getProgramId(),
                request.getBatchYear())) {
            return ResponseEntity.badRequest()
                    .body("Course batch already exists for this program and year");
        }

        CourseBatch batch = new CourseBatch();
        batch.setProgram(program);
        batch.setBatchYear(request.getBatchYear());
        batch.setStartYear(request.getStartYear() != null ? request.getStartYear() : request.getBatchYear());
        batch.setEndYear(request.getEndYear() != null ? request.getEndYear() : request.getBatchYear() + 4);
        // Default end year +4 if not provided, or logic can vary
        batch.setRemarks(request.getRemarks());
        batch.setStatus(CourseBatch.Status.ACTIVE);

        courseBatchRepository.save(batch);

        return ResponseEntity.ok(batch);
    }

    // 2️⃣ Get all batches
    @GetMapping
    public List<CourseBatch> getAllBatches() {
        return courseBatchRepository.findAll();
    }

    // 3️⃣ Get batches by program
    @GetMapping("/program/{programId}")
    public List<CourseBatch> getBatchesByProgram(@PathVariable Long programId) {
        return courseBatchRepository.findByProgramId(programId);
    }

    // 4️⃣ Mark batch as completed
    @PutMapping("/{id}/complete")
    public ResponseEntity<?> completeBatch(@PathVariable Long id) {
        CourseBatch batch = courseBatchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Batch not found"));

        batch.setStatus(CourseBatch.Status.COMPLETED);
        courseBatchRepository.save(batch);

        return ResponseEntity.ok("Batch marked as completed");
    }
}
