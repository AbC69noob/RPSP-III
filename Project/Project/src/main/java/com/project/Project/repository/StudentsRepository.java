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
}
