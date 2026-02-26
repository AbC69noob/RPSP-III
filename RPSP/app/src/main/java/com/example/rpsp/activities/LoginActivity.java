package com.example.rpsp.activities;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.text.InputType;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import com.example.rpsp.R;
import com.example.rpsp.api.ApiClient;
import com.example.rpsp.api.ApiService;
import com.example.rpsp.model.LoginRequest;
import com.example.rpsp.model.LoginResponse;
import java.util.HashMap;
import java.util.Map;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class LoginActivity extends AppCompatActivity {

    private EditText etUsername, etPassword;
    private Button btnLogin;
    private TextView tvForgotPassword;
    private ProgressBar progressBar;
    private ApiService apiService;
    private String pendingResetEmail;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        setTheme(com.google.android.material.R.style.Theme_MaterialComponents_DayNight_NoActionBar);
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        // Check if already logged in
        SharedPreferences prefs = getSharedPreferences("app_prefs", MODE_PRIVATE);
        String token = prefs.getString("token", null);
        if (token != null) {
            startActivity(new Intent(this, DashboardActivity.class));
            finish();
            return;
        }

        etUsername = findViewById(R.id.etUsername);
        etPassword = findViewById(R.id.etPassword);
        btnLogin = findViewById(R.id.btnLogin);
        tvForgotPassword = findViewById(R.id.tvForgotPassword);
        progressBar = findViewById(R.id.progressBar);

        apiService = ApiClient.getService();

        btnLogin.setOnClickListener(v -> login());
        tvForgotPassword.setOnClickListener(v -> showForgotPasswordEmailDialog());
    }

    private void login() {
        String username = etUsername.getText().toString().trim();
        String password = etPassword.getText().toString().trim();

        if (username.isEmpty() || password.isEmpty()) {
            Toast.makeText(this, "Please enter username and password", Toast.LENGTH_SHORT).show();
            return;
        }

        setAuthBusy(true);
        Call<LoginResponse> call = apiService.login(new LoginRequest(username, password));

        call.enqueue(new Callback<LoginResponse>() {
            @Override
            public void onResponse(Call<LoginResponse> call, Response<LoginResponse> response) {
                if (response.isSuccessful() && response.body() != null) {
                    handleLoginSuccess(response.body());
                } else {
                    setAuthBusy(false);
                    Toast.makeText(LoginActivity.this, "Login failed: Invalid credentials", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<LoginResponse> call, Throwable t) {
                setAuthBusy(false);
                Toast.makeText(LoginActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }

    private void handleLoginSuccess(LoginResponse body) {
        setAuthBusy(false);
        String token = body.getToken();
        boolean requiresPasswordChange = body.isRequiresPasswordChange();
        Long userId = body.getUserId();

        // Save token and userId
        SharedPreferences prefs = getSharedPreferences("app_prefs", MODE_PRIVATE);
        prefs.edit()
                .putString("token", "Bearer " + token)
                .putLong("userId", userId != null ? userId : -1)
                .apply();

        Intent intent;
        if (requiresPasswordChange) {
            intent = new Intent(LoginActivity.this, ChangePasswordActivity.class);
        } else {
            intent = new Intent(LoginActivity.this, DashboardActivity.class);
        }
        startActivity(intent);
        finish();
    }

    private void setAuthBusy(boolean busy) {
        progressBar.setVisibility(busy ? View.VISIBLE : View.GONE);
        btnLogin.setEnabled(!busy);
        if (tvForgotPassword != null) {
            tvForgotPassword.setEnabled(!busy);
            tvForgotPassword.setAlpha(busy ? 0.5f : 1f);
        }
    }

    private void showForgotPasswordEmailDialog() {
        final EditText input = new EditText(this);
        input.setHint("Email");
        input.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS);

        AlertDialog dialog = new AlertDialog.Builder(this)
                .setTitle("Forgot Password")
                .setMessage("Enter your email to receive a verification code.")
                .setView(input)
                .setPositiveButton("Send Code", null)
                .setNegativeButton("Cancel", (d, which) -> d.dismiss())
                .create();

        dialog.setOnShowListener(d -> {
            Button positive = dialog.getButton(AlertDialog.BUTTON_POSITIVE);
            positive.setOnClickListener(v -> {
                String email = input.getText().toString().trim();
                if (email.isEmpty()) {
                    input.setError("Email is required");
                    return;
                }
                sendResetOtp(email, dialog);
            });
        });

        dialog.show();
    }

    private void sendResetOtp(String email, AlertDialog dialogToDismiss) {
        setAuthBusy(true);
        Map<String, String> request = new HashMap<>();
        request.put("email", email);

        apiService.forgotPassword(request).enqueue(new Callback<okhttp3.ResponseBody>() {
            @Override
            public void onResponse(Call<okhttp3.ResponseBody> call, Response<okhttp3.ResponseBody> response) {
                setAuthBusy(false);
                if (response.isSuccessful()) {
                    pendingResetEmail = email;
                    if (dialogToDismiss != null) dialogToDismiss.dismiss();
                    showVerifyOtpDialog();
                } else {
                    Toast.makeText(LoginActivity.this, "Failed to send OTP. Please try again.", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<okhttp3.ResponseBody> call, Throwable t) {
                setAuthBusy(false);
                Toast.makeText(LoginActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }

    private void showVerifyOtpDialog() {
        final EditText input = new EditText(this);
        input.setHint("Verification Code");
        input.setInputType(InputType.TYPE_CLASS_NUMBER);

        AlertDialog dialog = new AlertDialog.Builder(this)
                .setTitle("Verify Code")
                .setMessage("Enter the code sent to your email.")
                .setView(input)
                .setPositiveButton("Verify", null)
                .setNegativeButton("Cancel", (d, which) -> d.dismiss())
                .create();

        dialog.setOnShowListener(d -> {
            Button positive = dialog.getButton(AlertDialog.BUTTON_POSITIVE);
            positive.setOnClickListener(v -> {
                String otp = input.getText().toString().trim();
                if (otp.isEmpty()) {
                    input.setError("Code is required");
                    return;
                }
                verifyOtp(otp, dialog);
            });
        });

        dialog.show();
    }

    private void verifyOtp(String otp, AlertDialog dialogToDismiss) {
        if (pendingResetEmail == null || pendingResetEmail.isEmpty()) {
            Toast.makeText(this, "Email missing. Please start again.", Toast.LENGTH_SHORT).show();
            return;
        }

        setAuthBusy(true);
        Map<String, String> request = new HashMap<>();
        request.put("email", pendingResetEmail);
        request.put("otp", otp);

        apiService.verifyOtp(request).enqueue(new Callback<okhttp3.ResponseBody>() {
            @Override
            public void onResponse(Call<okhttp3.ResponseBody> call, Response<okhttp3.ResponseBody> response) {
                setAuthBusy(false);
                if (response.isSuccessful()) {
                    if (dialogToDismiss != null) dialogToDismiss.dismiss();
                    showResetPasswordDialog();
                } else {
                    Toast.makeText(LoginActivity.this, "Invalid code. Please try again.", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<okhttp3.ResponseBody> call, Throwable t) {
                setAuthBusy(false);
                Toast.makeText(LoginActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }

    private void showResetPasswordDialog() {
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        int padding = (int) (16 * getResources().getDisplayMetrics().density);
        layout.setPadding(padding, padding, padding, 0);

        final EditText etNewPassword = new EditText(this);
        etNewPassword.setHint("New Password");
        etNewPassword.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_PASSWORD);
        layout.addView(etNewPassword);

        final EditText etConfirmPassword = new EditText(this);
        etConfirmPassword.setHint("Confirm Password");
        etConfirmPassword.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_PASSWORD);
        layout.addView(etConfirmPassword);

        AlertDialog dialog = new AlertDialog.Builder(this)
                .setTitle("Reset Password")
                .setMessage("Create a new password.")
                .setView(layout)
                .setPositiveButton("Change", null)
                .setNegativeButton("Cancel", (d, which) -> d.dismiss())
                .create();

        dialog.setOnShowListener(d -> {
            Button positive = dialog.getButton(AlertDialog.BUTTON_POSITIVE);
            positive.setOnClickListener(v -> {
                String newPass = etNewPassword.getText().toString().trim();
                String confirmPass = etConfirmPassword.getText().toString().trim();
                if (newPass.isEmpty()) {
                    etNewPassword.setError("Password required");
                    return;
                }
                if (!newPass.equals(confirmPass)) {
                    etConfirmPassword.setError("Passwords do not match");
                    return;
                }
                resetPassword(newPass, dialog);
            });
        });

        dialog.show();
    }

    private void resetPassword(String newPassword, AlertDialog dialogToDismiss) {
        if (pendingResetEmail == null || pendingResetEmail.isEmpty()) {
            Toast.makeText(this, "Email missing. Please start again.", Toast.LENGTH_SHORT).show();
            return;
        }

        setAuthBusy(true);
        Map<String, String> request = new HashMap<>();
        request.put("email", pendingResetEmail);
        request.put("password", newPassword);

        apiService.resetPassword(request).enqueue(new Callback<okhttp3.ResponseBody>() {
            @Override
            public void onResponse(Call<okhttp3.ResponseBody> call, Response<okhttp3.ResponseBody> response) {
                if (response.isSuccessful()) {
                    if (dialogToDismiss != null) dialogToDismiss.dismiss();
                    loginAfterReset(pendingResetEmail, newPassword);
                } else {
                    setAuthBusy(false);
                    Toast.makeText(LoginActivity.this, "Failed to reset password. Please try again.", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<okhttp3.ResponseBody> call, Throwable t) {
                setAuthBusy(false);
                Toast.makeText(LoginActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }

    private void loginAfterReset(String email, String newPassword) {
        apiService.login(new LoginRequest(email, newPassword)).enqueue(new Callback<LoginResponse>() {
            @Override
            public void onResponse(Call<LoginResponse> call, Response<LoginResponse> response) {
                if (response.isSuccessful() && response.body() != null) {
                    handleLoginSuccess(response.body());
                } else {
                    setAuthBusy(false);
                    Toast.makeText(LoginActivity.this, "Password updated. Please login.", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<LoginResponse> call, Throwable t) {
                setAuthBusy(false);
                Toast.makeText(LoginActivity.this, "Password updated. Please login.", Toast.LENGTH_SHORT).show();
            }
        });
    }
}
