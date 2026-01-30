package com.project.Project.repository;

import com.project.Project.model.Teacher_subjects;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TeacherSubjectsRepository extends JpaRepository<Teacher_subjects, Long> {
    Optional<Teacher_subjects> findBySubjectId(Long subjectId);

    List<Teacher_subjects> findByTeacherId(Long teacherId);
    
    List<Teacher_subjects> findByTeacherIdAndSubjectActiveTrue(Long teacherId);
}
