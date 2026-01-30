package com.project.Project.repository;

import com.project.Project.model.Subjects;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Sort;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface SubjectsRepository extends JpaRepository<Subjects, Long> {
        List<Subjects> findAllByActiveTrue(Sort sort);

        @org.springframework.data.jpa.repository.Query(value = "SELECT * FROM subjects s " +
                        "WHERE s.active = 1 " +
                        "AND s.program_id = :programId " +
                        "AND s.semester = :semester", nativeQuery = true)
        List<Subjects> findFilteredSubjects(
                        @Param("programId") Long programId,
                        @Param("semester") Integer semester);
}
