package com.project.Project.repository;

import com.project.Project.model.Subjects;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Sort;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SubjectsRepository extends JpaRepository<Subjects, Long> {

    List<Subjects> findAllByActiveTrue(Sort sort);

    @Query("SELECT s FROM Subjects s " +
            "WHERE s.active = true " +
            "AND s.program.id = :programId " +
            "AND s.semester = :semester " +
            "AND s.courseBatch.id = :batchId")
    List<Subjects> findFilteredSubjects(
            @Param("programId") Long programId,
            @Param("semester") Integer semester,
            @Param("batchId") Long batchId);
}
