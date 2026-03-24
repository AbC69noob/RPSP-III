package com.example.rpsp.activities;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import com.example.rpsp.R;
import com.example.rpsp.api.ApiClient;
import com.example.rpsp.api.ApiService;
import java.util.HashMap;
import java.util.Map;
import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ChangePasswordActivity extends AppCompatActivity {

    private EditText etNewPassword, etConfirmPassword;
    private Button btnChangePassword;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_change_password);

        etNewPassword = findViewById(R.id.etNewPassword);
        etConfirmPassword = findViewById(R.id.etConfirmPassword);
        btnChangePassword = findViewById(R.id.btnChangePassword);

        btnChangePassword.setOnClickListener(v -> changePassword());
    }

    private void changePassword() {
        String newPass = etNewPassword.getText().toString();
        String confirmPass = etConfirmPassword.getText().toString();

        if (newPass.isEmpty() || confirmPass.isEmpty()) {
            Toast.makeText(this, "Please fill all fields", Toast.LENGTH_SHORT).show();
            return;
        }

        if (!newPass.equals(confirmPass)) {
            Toast.makeText(this, "Passwords do not match", Toast.LENGTH_SHORT).show();
            return;
        }

        SharedPreferences prefs = getSharedPreferences("app_prefs", MODE_PRIVATE);
        String token = prefs.getString("token", "");
        Long userId = prefs.getLong("userId", -1);

        if (userId == -1) {
            Toast.makeText(this, "User ID not found, please login again", Toast.LENGTH_SHORT).show();
            startActivity(new Intent(this, LoginActivity.class));
            finish();
            return;
        }

        Map<String, String> body = new HashMap<>();
        body.put("userId", String.valueOf(userId));
        body.put("newPassword", newPass);

        ApiClient.getService().changePassword(token, body).enqueue(new Callback<ResponseBody>() {
            @Override
            public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
                if (response.isSuccessful()) {
                    Toast.makeText(ChangePasswordActivity.this, "Password changed!", Toast.LENGTH_SHORT).show();

                    // Navigate directly to Dashboard
                    startActivity(new Intent(ChangePasswordActivity.this, DashboardActivity.class));
                    finish();
                } else {
                    Toast.makeText(ChangePasswordActivity.this, "Failed to change password: " + response.code(), Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<ResponseBody> call, Throwable t) {
                Toast.makeText(ChangePasswordActivity.this, "Error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }
}
