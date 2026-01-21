package com.project.Project.service;

import com.project.Project.dto.UserRequest;
import com.project.Project.model.Role;
import com.project.Project.model.Users;
import com.project.Project.model.Teachers;
import com.project.Project.model.Students;
import com.project.Project.repository.TeachersRepository;
import com.project.Project.repository.StudentsRepository;
import com.project.Project.repository.UsersRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Date;
import java.util.List;

@Service
public class UserRegistrationService {

    private final UsersRepository usersRepo;
    private final TeachersRepository teachersRepo;
    private final StudentsRepository studentsRepo;
    private final PasswordEncoder passwordEncoder;

    public UserRegistrationService(
            UsersRepository usersRepo,
            TeachersRepository teachersRepo,
            StudentsRepository studentsRepo,
            PasswordEncoder passwordEncoder) {
        this.usersRepo = usersRepo;
        this.teachersRepo = teachersRepo;
        this.studentsRepo = studentsRepo;
        this.passwordEncoder = passwordEncoder;
    }

    // ================= REGISTER USER =================
    @Transactional
    public Users registerUser(UserRequest request) {

        Users user = new Users();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());
        user.setActive(true);
        user.setRequiresPasswordChange(false);

        Users savedUser = usersRepo.save(user);

        if (request.getRole() == Role.teacher) {
            createTeacher(savedUser, request);
        } else if (request.getRole() == Role.student) {
            createStudent(savedUser, request);
        }

        return savedUser;
    }

    // ================= GET USERS =================
    public List<Users> getUsers(Role role) {
        return role == null
                ? usersRepo.findByActiveTrue()
                : usersRepo.findByRoleAndActiveTrue(role);
    }

    // ================= DELETE USER =================
    @Transactional
    public void deleteUser(Long userId) {
        Users user = usersRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        user.setActive(false);
        usersRepo.save(user);

        // Also deactivate associated teacher status if exists
        teachersRepo.findAll().stream()
                .filter(t -> t.getUser().getId().equals(userId))
                .forEach(t -> {
                    t.setStatus(false);
                    teachersRepo.save(t);
                });
    }

    // ================= CREATE TEACHER =================
    private void createTeacher(Users user, UserRequest request) {
        Teachers teacher = new Teachers();
        teacher.setUser(user);
        teacher.setName(request.getUsername());
        teacher.setEmail(request.getEmail());
        teacher.setEmployeeId(request.getEmployeeId());
        teacher.setQualifications(request.getQualifications());
        teacher.setPermanentAddress(request.getPermanentAddress());
        teacher.setTemporaryAddress(request.getTemporaryAddress());
        teacher.setContactNo(request.getContactNo());
        teacher.setStatus(true);
        teacher.setGender(request.getGender());

        if (request.getDob() != null) {
            teacher.setDob(Date.valueOf(request.getDob())); // yyyy-MM-dd
        }

        teachersRepo.save(teacher);
    }

    // ================= CREATE STUDENT =================
    private void createStudent(Users user, UserRequest request) {
        Students student = new Students();
        student.setUser(user);
        student.setName(request.getUsername());
        student.setRollNo(request.getRollNo());
        student.setBatch(request.getBatch());
        student.setSemester(request.getSemester() != null ? request.getSemester() : 1);
        student.setPermanentAddress(request.getPermanentAddress());
        student.setTemporaryAddress(request.getTemporaryAddress());
        student.setGender(request.getGender());

        if (request.getDob() != null) {
            student.setDob(Date.valueOf(request.getDob())); // yyyy-MM-dd
        }

        // Optional: assign program if programId given
        // student.setProgram(programRepo.findById(request.getProgramId()).orElse(null));

        studentsRepo.save(student);
    }
}
