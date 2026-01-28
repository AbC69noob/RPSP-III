package com.project.Project.repository;

import com.project.Project.model.CourseBatch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CourseBatchRepository extends JpaRepository<CourseBatch, Long> {

    List<CourseBatch> findByProgramId(Long programId);

    Optional<CourseBatch> findByProgramIdAndBatchYear(Long programId, Integer batchYear);

    boolean existsByProgramIdAndBatchYear(Long programId, Integer batchYear);
}
