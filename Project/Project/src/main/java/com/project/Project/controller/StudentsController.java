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

        public StudentsController(
                        StudentsRepository repo,
                        UsersRepository usersRepository) {
                this.repo = repo;
                this.usersRepository = usersRepository;
        }

        // ================= GET ALL STUDENTS =================
        @GetMapping
        public ResponseEntity<List<Students>> getAllStudents() {
                return ResponseEntity.ok(repo.findAll());
        }

        // ================= FILTER BY COURSE BATCH & SEMESTER =================
        @GetMapping("/filter")
        public ResponseEntity<List<Students>> getFilteredStudents(
                        @RequestParam Long programId,
                        @RequestParam Integer semester) {
                return ResponseEntity.ok(
                                repo.findByProgramIdAndSemester(programId, semester));
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

                return ResponseEntity.ok(repo.save(student));
        }

        // ================= UPDATE STUDENT =================
        @PutMapping("/{id}")
        public ResponseEntity<Students> updateStudent(
                        @PathVariable Long id,
                        @RequestBody UpdateStudentRequest request) {
                Students student = repo.findById(id)
                                .orElseThrow(() -> new RuntimeException("Student not found"));

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
