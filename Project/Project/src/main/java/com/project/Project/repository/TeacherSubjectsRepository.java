package com.project.Project.repository;

import com.project.Project.model.Teacher_subjects;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TeacherSubjectsRepository extends JpaRepository<Teacher_subjects, Long> {
    Optional<Teacher_subjects> findBySubjectId(Long subjectId);
}
