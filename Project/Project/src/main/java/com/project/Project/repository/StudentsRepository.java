package com.project.Project.repository;

import com.project.Project.model.Students;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentsRepository extends JpaRepository<Students, Long> {

    // ✅ Find student using logged-in username
    Optional<Students> findByUserUsername(String username);

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT s.batch FROM Students s WHERE s.batch IS NOT NULL ORDER BY s.batch DESC")
    List<String> findDistinctBatches();

    List<Students> findByBatchAndProgramIdAndSemester(String batch, Long programId, Integer semester);
    
    // Alternative method with better null handling
    @org.springframework.data.jpa.repository.Query("SELECT s FROM Students s WHERE " +
            "(:batch IS NULL OR s.batch = :batch) AND " +
            "(:programId IS NULL OR s.program.id = :programId) AND " +
            "(:semester IS NULL OR s.semester = :semester)")
    List<Students> findByBatchAndProgramIdAndSemesterWithNulls(
            @org.springframework.data.repository.query.Param("batch") String batch,
            @org.springframework.data.repository.query.Param("programId") Long programId,
            @org.springframework.data.repository.query.Param("semester") Integer semester);
}
