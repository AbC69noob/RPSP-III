package com.project.Project.repository;

import com.project.Project.model.Subjects;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Sort;
import java.util.List;

public interface SubjectsRepository extends JpaRepository<Subjects, Long> {
    List<Subjects> findAllByActiveTrue(Sort sort);
}
