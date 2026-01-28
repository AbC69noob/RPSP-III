package com.project.Project.controller;

import com.project.Project.dto.UpdateStudentRequest;
import com.project.Project.model.Students;
import com.project.Project.model.Users;
import com.project.Project.repository.StudentsRepository;
import com.project.Project.repository.UsersRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/students")
public class StudentsController {

        private final StudentsRepository repo;
        private final UsersRepository usersRepository;
        private final com.project.Project.repository.StudentBatchRepository studentBatchRepository;

        public StudentsController(
                        StudentsRepository repo,
                        UsersRepository usersRepository,
                        com.project.Project.repository.StudentBatchRepository studentBatchRepository) {
                this.repo = repo;
                this.usersRepository = usersRepository;
                this.studentBatchRepository = studentBatchRepository;
        }

        // ================= GET ALL STUDENTS =================
        @GetMapping
        public ResponseEntity<List<Students>> getAllStudents() {
                return ResponseEntity.ok(repo.findAll());
        }

        // ================= FILTER BY COURSE BATCH & SEMESTER =================
        @GetMapping("/filter")
        public ResponseEntity<List<Students>> getFilteredStudents(
                        @RequestParam Long courseBatchId,
                        @RequestParam Integer semester) {
                return ResponseEntity.ok(
                                repo.findByStudentBatchCourseBatchIdAndSemester(courseBatchId, semester));
        }

        // ================= GET STUDENT BY ID =================
        @GetMapping("/{id}")
        public ResponseEntity<Students> getById(@PathVariable Long id) {
                Students student = repo.findById(id)
                                .orElseThrow(() -> new RuntimeException("Student not found"));
                return ResponseEntity.ok(student);
        }

        @PostMapping("/create")
        public ResponseEntity<Students> createStudent(
                        @RequestBody UpdateStudentRequest request) {
                // We prefer studentBatchId if provided
                if (request.getStudentBatchId() == null) {
                        throw new RuntimeException("Student Batch ID is required");
                }

                // com.project.Project.model.StudentBatch
                com.project.Project.model.StudentBatch batch = studentBatchRepository
                                .findById(request.getStudentBatchId())
                                .orElseThrow(() -> new RuntimeException("Student Batch not found"));

                Users user = usersRepository.findById(request.getUserId())
                                .orElseThrow(() -> new RuntimeException("User not found"));

                Students student = new Students();
                student.setUser(user);
                student.setName(request.getName());
                student.setGender(request.getGender());
                student.setDob(request.getDob());
                student.setRollNo(request.getRollNo());
                student.setSemester(request.getSemester());
                student.setPermanentAddress(request.getPermanentAddress());
                student.setTemporaryAddress(request.getTemporaryAddress());
                student.setStudentBatch(batch);
                // We might want to set Program from the batch if applicable, but for now
                // specific program might still be relevant if logic differs
                // student.setProgram(...) ?

                return ResponseEntity.ok(repo.save(student));
        }

        // ================= UPDATE STUDENT =================
        @PutMapping("/{id}")
        public ResponseEntity<Students> updateStudent(
                        @PathVariable Long id,
                        @RequestBody UpdateStudentRequest request) {
                Students student = repo.findById(id)
                                .orElseThrow(() -> new RuntimeException("Student not found"));

                // Logic Change: Use StudentBatch instead of CourseBatch
                if (request.getStudentBatchId() != null) {
                        com.project.Project.model.StudentBatch batch = studentBatchRepository
                                        .findById(request.getStudentBatchId())
                                        .orElseThrow(() -> new RuntimeException("Student batch not found"));
                        student.setStudentBatch(batch);
                }

                student.setName(request.getName());
                student.setRollNo(request.getRollNo());
                student.setSemester(request.getSemester());
                student.setPermanentAddress(request.getPermanentAddress());
                student.setTemporaryAddress(request.getTemporaryAddress());
                student.setGender(request.getGender());
                student.setDob(request.getDob());

                return ResponseEntity.ok(repo.save(student));
        }
}
