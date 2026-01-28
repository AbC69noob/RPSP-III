package com.project.Project.repository;

import com.project.Project.model.StudentBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StudentBatchRepository extends JpaRepository<StudentBatch, Long> {
}
