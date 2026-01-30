package com.project.Project.repository;

import com.project.Project.model.CourseBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CourseBatchRepository extends JpaRepository<CourseBatch, Long> {
}
