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
                where s.program.id = :programId
                  and m.subject.semester.id = :semesterId
                  and m.term.crTerm.id = :crTermId
                  and s.studentBatch.id = :studentBatchId
            """)
    List<Marks> findByProgramSemesterCrTermBatch(
            @Param("programId") Long programId,
            @Param("semesterId") Long semesterId,
            @Param("crTermId") Long crTermId,
            @Param("studentBatchId") Long studentBatchId);

    // ✅ ADD THIS
    boolean existsByStudentIdAndSubjectIdAndTermId(
            Long studentId,
            Long subjectId,
            Long termId);
}
