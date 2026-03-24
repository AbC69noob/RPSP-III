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
    private final com.project.Project.repository.SemesterRepository semesterRepo;

    public StudentsController(StudentsRepository repo,
            com.project.Project.repository.SemesterRepository semesterRepo) {
        this.repo = repo;
        this.semesterRepo = semesterRepo;
    }

    // ================= GET ALL STUDENTS =================
    @GetMapping
    public ResponseEntity<List<Students>> getAllStudents() {
        return ResponseEntity.ok(repo.findAll());
    }

    @GetMapping("/filter")
    public ResponseEntity<List<Students>> getFilteredStudents(
            @RequestParam Long programId,
            @RequestParam Long semesterId,
            @RequestParam(required = false) Long studentBatchId,
            @RequestParam(required = false) Long courseBatchId) {

        // Validate required parameters
        if (programId == null || semesterId == null) {
            return ResponseEntity.badRequest().build();
        }

        List<Students> students;
        if (studentBatchId != null) {
            students = repo.findByProgramIdAndSemesterIdAndStudentBatchId(programId, semesterId, studentBatchId);
        } else if (courseBatchId != null) {
            students = repo.findByProgramIdAndSemesterIdAndStudentBatchCourseBatchId(programId, semesterId, courseBatchId);
        } else {
            students = repo.findByProgramIdAndSemesterId(programId, semesterId);
        }

        System.out.println("Found " + students.size() + " students for Program: " + programId + ", Sem: " + semesterId + ", Batch: " + (studentBatchId != null ? studentBatchId : courseBatchId));

        return ResponseEntity.ok(students);
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
        if (updated.getSemester() != null && updated.getSemester().getId() != null) {
             com.project.Project.model.Semester sem = semesterRepo.findById(updated.getSemester().getId())
                    .orElseThrow(() -> new RuntimeException("Semester not found"));
             student.setSemester(sem);
        }
        student.setProgram(updated.getProgram());
        student.setPermanentAddress(updated.getPermanentAddress());
        student.setTemporaryAddress(updated.getTemporaryAddress());
        student.setGender(updated.getGender());
        student.setDob(updated.getDob());

        Students saved = repo.save(student);
        return ResponseEntity.ok(saved);
    }

    // ================= BULK UPDATE STUDENT SEMESTER =================
    @PutMapping("/bulk-semester")
    @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('admin')")
    public ResponseEntity<String> bulkUpdateSemester(@RequestBody com.project.Project.dto.BulkSemesterUpdateRequest request) {
        if (request.getStudentIds() == null || request.getStudentIds().isEmpty()) {
            return ResponseEntity.badRequest().body("No student IDs provided");
        }
        if (request.getTargetSemesterId() == null) {
            return ResponseEntity.badRequest().body("Target semester ID is required");
        }

        com.project.Project.model.Semester targetSemester = semesterRepo.findById(request.getTargetSemesterId())
                .orElseThrow(() -> new RuntimeException("Target semester not found"));

        List<Students> studentsToUpdate = repo.findAllById(request.getStudentIds());
        for (Students student : studentsToUpdate) {
            student.setSemester(targetSemester);
        }
        
        repo.saveAll(studentsToUpdate);
        return ResponseEntity.ok("Successfully updated semester for " + studentsToUpdate.size() + " students.");
    }
}
