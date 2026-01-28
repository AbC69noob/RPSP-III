package com.project.Project.repository;

import com.project.Project.model.Students;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentsRepository extends JpaRepository<Students, Long> {

        Optional<Students> findByUserUsername(String username);

        // 🔥 Get students by Course Batch (via StudentBatch) + Semester
        List<Students> findByStudentBatchCourseBatchIdAndSemester(Long courseBatchId, Integer semester);

        // 🔥 Get students by Program (via StudentBatch -> CourseBatch)
        List<Students> findByStudentBatchCourseBatchProgramId(Long programId);
}
