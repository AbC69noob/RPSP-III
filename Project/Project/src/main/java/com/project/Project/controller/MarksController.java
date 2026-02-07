//MarksController
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

    @GetMapping("/my-marks")
    public List<StudentMarksDto> getMyMarks(
            @RequestParam Integer semester,
            @RequestParam Long termId) {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        Students student = studentRepo.findByUserUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Student profile not found for user: " + username));

        List<Marks> marksList = marksRepo.findByProgramSemesterTermBatch(
                student.getProgram().getId(),
                semester,
                termId,
                student.getStudentBatch().getId());

        // Filter for THIS student only (Repo method returns whole batch)
        // Optimization: Create a specific repo method findByStudentAndSemesterAndTerm?
        // For now, filtering in memory or using existing logic is fine.
        // Actually, let's filter the results to only include this student's marks.

        marksList = marksList.stream()
                .filter(m -> m.getStudent().getId().equals(student.getId()))
                .toList();

        // Convert to DTO
        Map<Long, StudentMarksDto> studentMap = new HashMap<>();
        StudentMarksDto dto = new StudentMarksDto(student.getId(), student.getName(), student.getRollNo());

        for (Marks m : marksList) {
            dto.addMark(
                    m.getSubject().getName(),
                    m.getObtainedMarks(),
                    m.getSubject().getFullMark(),
                    m.getSubject().getPassMarks());
        }

        return List.of(dto);
    }

    @GetMapping("/search")
    public List<StudentMarksDto> searchMarks(
            @RequestParam Long programId,
            @RequestParam Integer semester,
            @RequestParam Long termId,
            @RequestParam Long studentBatchId) {
        List<Marks> marksList = marksRepo.findByProgramSemesterTermBatch(programId, semester, termId, studentBatchId);

        // Map studentId -> DTO
        Map<Long, StudentMarksDto> studentMap = new HashMap<>();

        for (Marks m : marksList) {
            Long studentId = m.getStudent().getId();
            StudentMarksDto dto = studentMap.get(studentId);
            if (dto == null) {
                dto = new StudentMarksDto(studentId, m.getStudent().getName(), m.getStudent().getRollNo());
                studentMap.put(studentId, dto);
            }

            dto.addMark(
                    m.getSubject().getName(),
                    m.getObtainedMarks(),
                    m.getSubject().getFullMark(),
                    m.getSubject().getPassMarks());
        }

        // Return sorted by RollNo
        return studentMap.values().stream()
                .sorted((a, b) -> a.getRollNo().compareTo(b.getRollNo()))
                .toList();
    }

    @PostMapping("/bulk")
    public List<Marks> createBulk(@RequestBody List<Marks> marksList) {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        Users uploader = userRepo.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Logged-in user not found"));

        for (Marks marks : marksList) {

            if (marks.getStudent() == null || marks.getStudent().getId() == null)
                throw new IllegalArgumentException("Student ID must not be null");

            if (marks.getSubject() == null || marks.getSubject().getId() == null)
                throw new IllegalArgumentException("Subject ID must not be null");

            if (marks.getTerm() == null || marks.getTerm().getId() == null)
                throw new IllegalArgumentException("Term ID must not be null");

            if (marks.getObtainedMarks() == null)
                throw new IllegalArgumentException("Obtained marks must not be null");

            Students student = studentRepo.findById(marks.getStudent().getId())
                    .orElseThrow(() -> new IllegalArgumentException("Student not found"));

            Subjects subject = subjectRepo.findById(marks.getSubject().getId())
                    .orElseThrow(() -> new IllegalArgumentException("Subject not found"));

            Terms term = termRepo.findById(marks.getTerm().getId())
                    .orElseThrow(() -> new IllegalArgumentException("Term not found"));

            marks.setStudent(student);
            marks.setSubject(subject);
            marks.setTerm(term);
            marks.setUploadedBy(uploader);
            marks.setUploadedAt(new Timestamp(System.currentTimeMillis()));
        }

        return marksRepo.saveAll(marksList);
    }
}