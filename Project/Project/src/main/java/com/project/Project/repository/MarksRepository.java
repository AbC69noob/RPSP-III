package com.project.Project.repository;

import com.project.Project.model.Marks;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MarksRepository extends JpaRepository<Marks, Long> {

        // 🔹 Get marks for students by CourseBatch, Program, Semester, and Term
        @Query("""
                            select m from Marks m
                            join m.student s
                            where s.studentBatch.courseBatch.id = :courseBatchId
                              and s.studentBatch.courseBatch.program.id = :programId
                              and s.semester = :semester
                              and m.term.id = :termId
                        """)
        List<Marks> findByBatchProgramSemesterTerm(
                        @Param("courseBatchId") Long courseBatchId,
                        @Param("programId") Long programId,
                        @Param("semester") Integer semester,
                        @Param("termId") Long termId);

        // 🔹 Derived query updated to reflect Student -> StudentBatch -> CourseBatch
        // path
        List<Marks> findByStudent_StudentBatch_CourseBatch_IdAndStudent_SemesterAndTerm_Id(
                        Long courseBatchId, Integer semester, Long termId);
}
