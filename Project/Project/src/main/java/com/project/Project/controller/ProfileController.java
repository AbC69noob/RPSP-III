package com.project.Project.controller;

import com.project.Project.dto.ProfileDto;
import com.project.Project.dto.StudentDetailsDto;
import com.project.Project.model.Users;
import com.project.Project.repository.UsersRepository;
import com.project.Project.repository.TeachersRepository;
import com.project.Project.repository.StudentsRepository;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/profile")
public class ProfileController {

        private final UsersRepository usersRepository;
        private final TeachersRepository teachersRepository;
        private final StudentsRepository studentsRepository;

        public ProfileController(UsersRepository usersRepository,
                        TeachersRepository teachersRepository,
                        StudentsRepository studentsRepository) {
                this.usersRepository = usersRepository;
                this.teachersRepository = teachersRepository;
                this.studentsRepository = studentsRepository;
        }

        /**
         * Get logged-in user's profile
         * Username is extracted from JWT (SecurityContext)
         */
        @GetMapping
        public ProfileDto getProfile(Authentication authentication) {

                String username = authentication.getName();

                Users user = usersRepository.findByUsername(username)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                // TEACHER PROFILE
                if ("teacher".equalsIgnoreCase(user.getRole().name())) {
                        Long teacherId = teachersRepository.findByUserId(user.getId())
                                        .map(com.project.Project.model.Teachers::getId)
                                        .orElse(null);
                        return new ProfileDto(
                                        user.getId(),
                                        user.getUsername(),
                                        user.getUsername(),
                                        user.getRole().name(),
                                        teacherId);
                }

                // STUDENT PROFILE
                if ("student".equalsIgnoreCase(user.getRole().name())) {
                        StudentDetailsDto details = studentsRepository.findByUserUsername(username)
                                        .map(s -> new StudentDetailsDto(
                                                        String.valueOf(s.getRollNo()),
                                                        s.getProgram().getName(),
                                                        s.getStudentBatch().getName()))
                                        .orElse(null);

                        return new ProfileDto(
                                        user.getId(),
                                        user.getUsername(),
                                        user.getUsername(),
                                        user.getRole().name(),
                                        user.getRequiresPasswordChange(),
                                        details);
                }

                // ADMIN / OTHER
                return new ProfileDto(
                                user.getId(),
                                user.getUsername(), // display name
                                user.getUsername(),
                                user.getRole().name(),
                                user.getRequiresPasswordChange(),
                                null);
        }
}
