package com.project.Project.repository;

import com.project.Project.model.Teachers;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TeachersRepository extends JpaRepository<Teachers, Long> {
    Optional<Teachers> findByUserId(Long userId);
}
