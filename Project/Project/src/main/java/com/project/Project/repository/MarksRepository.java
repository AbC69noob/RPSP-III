package com.project.Project.repository;

import com.project.Project.model.Marks;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MarksRepository extends JpaRepository<Marks, Long> {

    @Query("""
        select m from Marks m
        join m.student s
        where s.batch = :batch
          and s.program.id = :programId
          and s.semester = :semester
          and m.term.id = :termId
    """)
    List<Marks> findByBatchProgramSemesterTerm(
            @Param("batch") String batch,
            @Param("programId") Long programId,
            @Param("semester") Integer semester,
            @Param("termId") Long termId
    );

    // ✅ ADD THIS
    boolean existsByStudentIdAndSubjectIdAndTermId(
            Long studentId,
            Long subjectId,
            Long termId
    );
}

