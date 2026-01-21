package com.project.Project.repository;

import com.project.Project.model.Role;
import com.project.Project.model.Users;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UsersRepository extends JpaRepository<Users, Long> {

    Optional<Users> findByUsername(String username);

    Optional<Users> findByEmail(String email);

    List<Users> findByRole(Role role);

    List<Users> findByRoleIn(List<Role> roles);

    List<Users> findByActiveTrue();

    List<Users> findByRoleAndActiveTrue(Role role);
}
