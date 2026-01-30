package com.project.Project.controller;

import com.project.Project.dto.UserRequest;
import com.project.Project.model.Role;
import com.project.Project.model.Users;
import com.project.Project.service.UserRegistrationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
public class UsersController {

    private final UserRegistrationService registrationService;

    public UsersController(UserRegistrationService registrationService) {
        this.registrationService = registrationService;
    }

    // ================= CREATE USER =================
    @PostMapping("/create")
    public ResponseEntity<Users> createUser(@RequestBody UserRequest request) {
        Users user = registrationService.registerUser(request);
        return ResponseEntity.ok(user);
    }

    // ================= GET USERS =================
    @GetMapping
    public ResponseEntity<List<Users>> getUsers(@RequestParam(required = false) Role role) {
        List<Users> users = registrationService.getUsers(role);
        return ResponseEntity.ok(users);
    }

    // ================= DELETE USER =================
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable Long id) {
        registrationService.deleteUser(id);
        return ResponseEntity.ok("User deleted with id: " + id);
    }

    // ================= CHANGE PASSWORD =================
    @PostMapping("/change-password")
    public ResponseEntity<String> changePassword(@RequestBody java.util.Map<String, String> request) {
        Long userId = Long.parseLong(request.get("userId"));
        String newPassword = request.get("newPassword");
        registrationService.changePassword(userId, newPassword);
        return ResponseEntity.ok("Password changed successfully");
    }
}
