package com.project.Project.controller;

import com.project.Project.dto.StudentMarksDto;
import com.project.Project.model.Marks;
import com.project.Project.model.Students;
import com.project.Project.model.Subjects;
import com.project.Project.model.Terms;
import com.project.Project.model.Users;
import com.project.Project.repository.MarksRepository;
import com.project.Project.repository.StudentsRepository;
import com.project.Project.repository.SubjectsRepository;
import com.project.Project.repository.TermsRepository;
import com.project.Project.repository.UsersRepository;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

@RestController
@RequestMapping("/marks")
public class MarksController {

    private final MarksRepository marksRepo;
    private final StudentsRepository studentRepo;
    private final SubjectsRepository subjectRepo;
    private final TermsRepository termRepo;
    private final UsersRepository userRepo;

    public MarksController(MarksRepository marksRepo,
                           StudentsRepository studentRepo,
                           SubjectsRepository subjectRepo,
                           TermsRepository termRepo,
                           UsersRepository userRepo) {
        this.marksRepo = marksRepo;
        this.studentRepo = studentRepo;
        this.subjectRepo = subjectRepo;
        this.termRepo = termRepo;
        this.userRepo = userRepo;
    }

    @GetMapping
    public List<Marks> getAll() {
        return marksRepo.findAll();
    }
    @GetMapping("/search")
    public List<StudentMarksDto> searchMarks(
            @RequestParam String batch,
            @RequestParam Long programId,
            @RequestParam Integer semester,
            @RequestParam Long termId
    ) {
        List<Marks> marksList = marksRepo.findByBatchProgramSemesterTerm(batch, programId, semester, termId);

        // Map studentId -> DTO
        Map<Long, StudentMarksDto> studentMap = new HashMap<>();

        for (Marks m : marksList) {
            Long studentId = m.getStudent().getId();
            StudentMarksDto dto = studentMap.get(studentId);
            if (dto == null) {
                dto = new StudentMarksDto(studentId, m.getStudent().getName(), m.getStudent().getRollNo());
                studentMap.put(studentId, dto);
            }

            dto.addMark(m.getSubject().getName(), m.getObtainedMarks());
        }

        // Return sorted by RollNo
        return studentMap.values().stream()
                .sorted((a, b) -> a.getRollNo().compareTo(b.getRollNo()))
                .toList();
    }
    @PostMapping
    public Marks create(@RequestBody Marks marks) {

        // ===============================
        // GET LOGGED-IN USER FROM JWT
        // ===============================
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName(); // comes from JWT

        Users uploader = userRepo.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Logged-in user not found"));

        // ===============================
        // VALIDATIONS
        // ===============================
        if (marks.getStudent() == null || marks.getStudent().getId() == null)
            throw new IllegalArgumentException("Student ID must not be null");

        if (marks.getSubject() == null || marks.getSubject().getId() == null)
            throw new IllegalArgumentException("Subject ID must not be null");

        if (marks.getTerm() == null || marks.getTerm().getId() == null)
            throw new IllegalArgumentException("Term ID must not be null");

        if (marks.getObtainedMarks() == null)
            throw new IllegalArgumentException("Obtained marks must not be null");

        // ===============================
        // PREVENT DUPLICATES
        // ===============================
        if (marksRepo.existsByStudentIdAndSubjectIdAndTermId(
                marks.getStudent().getId(),
                marks.getSubject().getId(),
                marks.getTerm().getId()
        )) {
            throw new IllegalStateException("Marks already assigned for this subject");
        }

        // ===============================
        // FETCH ENTITIES
        // ===============================
        Students student = studentRepo.findById(marks.getStudent().getId())
                .orElseThrow(() -> new IllegalArgumentException("Student not found"));

        Subjects subject = subjectRepo.findById(marks.getSubject().getId())
                .orElseThrow(() -> new IllegalArgumentException("Subject not found"));

        Terms term = termRepo.findById(marks.getTerm().getId())
                .orElseThrow(() -> new IllegalArgumentException("Term not found"));

        // ===============================
        // SET FIELDS
        // ===============================
        marks.setStudent(student);
        marks.setSubject(subject);
        marks.setTerm(term);
        marks.setUploadedBy(uploader);
        marks.setUploadedAt(new Timestamp(System.currentTimeMillis()));

        return marksRepo.save(marks);
    }
}
