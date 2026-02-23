package com.project.Project.repository;

import com.project.Project.model.Students;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentsRepository extends JpaRepository<Students, Long> {

        // ✅ Find student using logged-in username
        Optional<Students> findByUserUsername(String username);

        // Find students by program and semester
        List<Students> findByProgramIdAndSemesterId(Long programId, Long semesterId);

        // Find students by program, semester, and course revision (batch)
        List<Students> findByProgramIdAndSemesterIdAndStudentBatchCourseBatchId(Long programId, Long semesterId,
                        Long courseBatchId);

        // Find students by program, semester, and student batch
        List<Students> findByProgramIdAndSemesterIdAndStudentBatchId(Long programId, Long semesterId, Long studentBatchId);
}
