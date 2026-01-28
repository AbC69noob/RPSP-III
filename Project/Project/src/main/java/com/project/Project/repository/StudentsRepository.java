package com.project.Project.repository;

import com.project.Project.model.Students;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentsRepository extends JpaRepository<Students, Long> {

        Optional<Students> findByUserUsername(String username);

        List<Students> findByProgramIdAndSemester(Long programId, Integer semester);
}
