package com.project.Project.repository;

import com.project.Project.model.Students;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StudentsRepository extends JpaRepository<Students, Long> {

    // ✅ Find student using logged-in username
    Optional<Students> findByUserUsername(String username);
}
