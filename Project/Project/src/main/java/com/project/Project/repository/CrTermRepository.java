package com.project.Project.repository;

import com.project.Project.model.CrTerm;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CrTermRepository extends JpaRepository<CrTerm, Long> {
    Optional<CrTerm> findByName(String name);
}
