package com.project.Project.controller;

import com.project.Project.model.Users;
import com.project.Project.repository.UsersRepository;
import com.project.Project.service.EmailService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Random;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UsersRepository usersRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    public AuthController(
            UsersRepository usersRepository,
            EmailService emailService,
            PasswordEncoder passwordEncoder
    ) {
        this.usersRepository = usersRepository;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
    }

    // ===============================
    // SEND OTP (Forgot Password)
    // ===============================
    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@RequestBody Map<String, String> req) {
        String email = req.get("email");

        var userOpt = usersRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Email not registered"));
        }

        Users user = userOpt.get();
        String otp = String.valueOf(100000 + new Random().nextInt(900000));

        user.setResetOtp(otp);
        user.setResetOtpExpiry(LocalDateTime.now().plusMinutes(10));
        user.setOtpVerified(false);

        usersRepository.save(user);
        emailService.sendOtp(email, otp);

        return ResponseEntity.ok(Map.of("message", "OTP sent to email"));
    }

    // ===============================
    // VERIFY OTP
    // ===============================
    @PostMapping("/verify-otp")
    public ResponseEntity<Map<String, String>> verifyOtp(@RequestBody Map<String, String> req) {
        var userOpt = usersRepository.findByEmail(req.get("email"));
        if (userOpt.isEmpty()) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Email not registered"));
        }

        Users user = userOpt.get();

        if (user.getResetOtp() == null ||
                !user.getResetOtp().equals(req.get("otp")) ||
                user.getResetOtpExpiry().isBefore(LocalDateTime.now())) {

            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Invalid or expired OTP"));
        }

        user.setOtpVerified(true);
        usersRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "OTP verified"));
    }

    // ===============================
    // RESET PASSWORD
    // ===============================
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@RequestBody Map<String, String> req) {
        var userOpt = usersRepository.findByEmail(req.get("email"));
        if (userOpt.isEmpty()) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Email not registered"));
        }

        Users user = userOpt.get();

        if (!Boolean.TRUE.equals(user.getOtpVerified())) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "OTP not verified"));
        }

        user.setPasswordHash(passwordEncoder.encode(req.get("password")));
        user.setResetOtp(null);
        user.setResetOtpExpiry(null);
        user.setOtpVerified(false);

        usersRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Password reset successful"));
    }
}
