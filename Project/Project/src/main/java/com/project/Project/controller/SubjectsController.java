package com.project.Project.controller;

import com.project.Project.dto.SubjectRequest;
import com.project.Project.model.Programs;
import com.project.Project.model.Subjects;
import com.project.Project.model.Teacher_subjects;
import com.project.Project.model.Teachers;
import com.project.Project.repository.ProgramsRepository;
import com.project.Project.repository.SubjectsRepository;
import com.project.Project.repository.TeacherSubjectsRepository;
import com.project.Project.repository.TeachersRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Sort;
import java.util.Map;

import java.util.List;

@RestController
@RequestMapping("/subjects")
public class SubjectsController {

    private final SubjectsRepository repo;
    private final ProgramsRepository programsRepo;
    private final TeachersRepository teachersRepo;
    private final TeacherSubjectsRepository teacherSubjectsRepo;
    private final com.project.Project.repository.CourseBatchRepository courseBatchRepo;

    public SubjectsController(SubjectsRepository repo,
            ProgramsRepository programsRepo,
            TeachersRepository teachersRepo,
            TeacherSubjectsRepository teacherSubjectsRepo,
            com.project.Project.repository.CourseBatchRepository courseBatchRepo) {
        this.repo = repo;
        this.programsRepo = programsRepo;
        this.teachersRepo = teachersRepo;
        this.teacherSubjectsRepo = teacherSubjectsRepo;
        this.courseBatchRepo = courseBatchRepo;
    }

    // ADMIN + TEACHER can view
    @GetMapping
    @PreAuthorize("hasAnyAuthority('admin','teacher')")
    public List<Subjects> getAll() {
        return repo.findAllByActiveTrue(Sort.by("program.name").ascending().and(Sort.by("semester").ascending()));
    }

    @GetMapping("/filter")
    @PreAuthorize("hasAnyAuthority('admin','teacher')")
    public List<Subjects> getFiltered(
            @RequestParam Long programId,
            @RequestParam Integer semester) {
        System.out
                .println("Filtering subjects: programId=" + programId + ", semester=" + semester);
        List<Subjects> result = repo.findFilteredSubjects(programId, semester);
        System.out.println("Found " + result.size() + " subjects");
        return result;
    }

    // ADMIN ONLY can create
    // ADMIN ONLY can create
    @PostMapping
    @PreAuthorize("hasAuthority('admin')") // Fixed: Use hasAuthority
    @Transactional
    public ResponseEntity<Subjects> create(@RequestBody SubjectRequest request) {
        // 1. Fetch Program
        Programs program = programsRepo.findById(request.getProgramId())
                .orElseThrow(() -> new RuntimeException("Program not found"));

        // 2. Create Subject
        Subjects subject = new Subjects();
        subject.setCode(request.getCode());
        subject.setName(request.getName());
        subject.setFullMark(request.getFullMark());
        subject.setPassMarks(request.getPassMarks());
        subject.setSemester(request.getSemester());
        subject.setProgram(program);

        // 3. Fetch Course Batch if provided
        if (request.getCourseBatchId() != null) {
            com.project.Project.model.CourseBatch courseBatch = courseBatchRepo.findById(request.getCourseBatchId())
                    .orElseThrow(() -> new RuntimeException("Course Batch not found"));
            subject.setCourseBatch(courseBatch);
        }

        subject.setCreatedAt(new java.sql.Timestamp(System.currentTimeMillis()));

        Subjects savedSubject = repo.save(subject);

        // 4. Assign Teacher if provided
        if (request.getTeacherId() != null) {
            Teachers teacher = teachersRepo.findById(request.getTeacherId())
                    .orElseThrow(() -> new RuntimeException("Teacher not found"));

            Teacher_subjects ts = new Teacher_subjects();
            ts.setTeacher(teacher);
            ts.setSubject(savedSubject);
            ts.setStudentProgram(program);
            ts.setStudentSemester(request.getSemester());

            teacherSubjectsRepo.save(ts);
        }

        return ResponseEntity.ok(savedSubject);
    }

    // UPDATE TEACHER ASSIGNMENT
    @PutMapping("/{id}/teacher")
    @PreAuthorize("hasAnyAuthority('admin')")
    @Transactional
    public ResponseEntity<?> updateTeacher(@PathVariable Long id, @RequestBody Map<String, Long> payload) {
        Long teacherId = payload.get("teacherId");

        Subjects subject = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Subject not found"));

        Teachers teacher = teachersRepo.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));

        Teacher_subjects assignment = teacherSubjectsRepo.findBySubjectId(id)
                .orElse(new Teacher_subjects());

        if (assignment.getId() == null) {
            // New assignment
            assignment.setSubject(subject);
            assignment.setStudentProgram(subject.getProgram());
            assignment.setStudentSemester(subject.getSemester());
        }

        assignment.setTeacher(teacher);
        teacherSubjectsRepo.save(assignment);

        return ResponseEntity.ok("Teacher assigned successfully");
    }

    // REMOVE TEACHER ASSIGNMENT
    @DeleteMapping("/{id}/teacher")
    @PreAuthorize("hasAnyAuthority('admin')")
    @Transactional
    public ResponseEntity<?> removeTeacher(@PathVariable Long id) {
        Subjects subject = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Subject not found"));

        Teacher_subjects assignment = teacherSubjectsRepo.findBySubjectId(id)
                .orElse(null);

        if (assignment != null) {
            teacherSubjectsRepo.delete(assignment);
        }

        return ResponseEntity.ok("Teacher unassigned successfully");
    }

    // SOFT DELETE SUBJECT
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('admin')")
    @Transactional
    public ResponseEntity<?> deleteSubject(@PathVariable Long id) {
        Subjects subject = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Subject not found"));

        subject.setActive(false);
        repo.save(subject);
        return ResponseEntity.ok("Subject deactivated successfully");
    }
}
