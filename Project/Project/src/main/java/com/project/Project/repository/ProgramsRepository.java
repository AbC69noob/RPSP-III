package com.project.Project.repository;

import com.project.Project.model.Programs;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProgramsRepository extends JpaRepository<Programs, Long> {
    List<Programs> findByFacultyId(Long facultyId);
}
