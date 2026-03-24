package com.example.rpsp.activities;

import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.ProgressBar;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.example.rpsp.R;
import com.example.rpsp.api.ApiClient;
import com.example.rpsp.api.ApiService;
import com.example.rpsp.model.CrTerm;
import com.example.rpsp.model.ProfileDto;
import com.example.rpsp.model.Semester;
import com.example.rpsp.model.StudentDetailsDto;
import com.example.rpsp.model.StudentMarksDto;
import java.util.ArrayList;
import java.util.List;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class DashboardActivity extends AppCompatActivity {

    private TextView tvStudentName, tvRollNumber, tvProgram, tvBatch, tvTotalPercentage;
    private View layoutSummary;
    private Spinner spinnerSemester, spinnerTerm;
    private Button btnViewResults;
    private RecyclerView rvMarks;
    private ProgressBar progressBar;

    private ApiService apiService;
    private String token;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_dashboard);

        // Initialize Views
        tvStudentName = findViewById(R.id.tvStudentName);
        tvRollNumber = findViewById(R.id.tvRollNumber);
        tvProgram = findViewById(R.id.tvProgram);
        tvBatch = findViewById(R.id.tvBatch);
        spinnerSemester = findViewById(R.id.spinnerSemester);
        spinnerTerm = findViewById(R.id.spinnerTerm);
        btnViewResults = findViewById(R.id.btnViewResults);
        rvMarks = findViewById(R.id.rvMarks);
        progressBar = findViewById(R.id.progressBar);
        tvTotalPercentage = findViewById(R.id.tvTotalPercentage);
        layoutSummary = findViewById(R.id.layoutSummary);

        rvMarks.setLayoutManager(new LinearLayoutManager(this));

        SharedPreferences prefs = getSharedPreferences("app_prefs", MODE_PRIVATE);
        token = prefs.getString("token", "");

        if (token.isEmpty()) {
            startActivity(new Intent(this, LoginActivity.class));
            finish();
            return;
        }

        apiService = ApiClient.getService();

        fetchSemesters();
        fetchTerms();
        fetchProfile();

        btnViewResults.setOnClickListener(v -> fetchResults());
    }

    private void fetchProfile() {
        apiService.getProfile(token).enqueue(new Callback<ProfileDto>() {
            @Override
            public void onResponse(Call<ProfileDto> call, Response<ProfileDto> response) {
                if (response.isSuccessful() && response.body() != null) {
                    ProfileDto profile = response.body();
                    tvStudentName.setText(profile.getName());

                    if (profile.getStudentDetails() != null) {
                        StudentDetailsDto details = profile.getStudentDetails();
                        tvRollNumber.setText(details.getRollNo());
                        tvProgram.setText(details.getProgramName());
                        tvBatch.setText(details.getBatchName());
                    } else {
                        tvRollNumber.setText("N/A");
                        tvProgram.setText("N/A");
                        tvBatch.setText("N/A");
                    }
                } else {
                    Toast.makeText(DashboardActivity.this, "Failed to load profile", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<ProfileDto> call, Throwable t) {
                Toast.makeText(DashboardActivity.this, "Profile Error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void fetchSemesters() {
        apiService.getSemesters(token).enqueue(new Callback<List<Semester>>() {
            @Override
            public void onResponse(Call<List<Semester>> call, Response<List<Semester>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    ArrayAdapter<Semester> adapter = new ArrayAdapter<>(DashboardActivity.this,
                            android.R.layout.simple_spinner_dropdown_item, response.body());
                    spinnerSemester.setAdapter(adapter);
                } else {
                    Toast.makeText(DashboardActivity.this, "Failed to load semesters", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<List<Semester>> call, Throwable t) {
                Toast.makeText(DashboardActivity.this, "Semester Error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void fetchTerms() {
        apiService.getCrTerms(token).enqueue(new Callback<List<CrTerm>>() {
            @Override
            public void onResponse(Call<List<CrTerm>> call, Response<List<CrTerm>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    ArrayAdapter<CrTerm> adapter = new ArrayAdapter<>(DashboardActivity.this,
                            android.R.layout.simple_spinner_dropdown_item, response.body());
                    spinnerTerm.setAdapter(adapter);
                } else {
                    Toast.makeText(DashboardActivity.this, "Failed to load terms", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<List<CrTerm>> call, Throwable t) {
                Toast.makeText(DashboardActivity.this, "Term Error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void fetchResults() {
        Semester semester = (Semester) spinnerSemester.getSelectedItem();
        CrTerm term = (CrTerm) spinnerTerm.getSelectedItem();

        if (semester == null || term == null) {
            Toast.makeText(this, "Please select semester and term", Toast.LENGTH_SHORT).show();
            return;
        }

        progressBar.setVisibility(View.VISIBLE);
        rvMarks.setAdapter(null); // Clear previous results
        layoutSummary.setVisibility(View.GONE);

        apiService.getMyMarks(token, semester.getId(), term.getId()).enqueue(new Callback<List<StudentMarksDto>>() {
            @Override
            public void onResponse(Call<List<StudentMarksDto>> call, Response<List<StudentMarksDto>> response) {
                progressBar.setVisibility(View.GONE);
                if (response.isSuccessful() && response.body() != null && !response.body().isEmpty()) {
                    StudentMarksDto data = response.body().get(0);
                    List<StudentMarksDto.MarkDto> marksList = data.getMarksList();

                    if (marksList != null && !marksList.isEmpty()) {
                        MarksAdapter adapter = new MarksAdapter(marksList);
                        rvMarks.setAdapter(adapter);
                        updateTotalPercentage(marksList);
                    } else {
                        Toast.makeText(DashboardActivity.this, "No marks found for this criteria", Toast.LENGTH_SHORT)
                                .show();
                    }
                } else {
                    Toast.makeText(DashboardActivity.this, "No results found. Are they published?", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<List<StudentMarksDto>> call, Throwable t) {
                progressBar.setVisibility(View.GONE);
                Toast.makeText(DashboardActivity.this, "Error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void updateTotalPercentage(List<StudentMarksDto.MarkDto> marksList) {
        double totalObtained = 0.0;
        double totalFull = 0.0;
        for (StudentMarksDto.MarkDto mark : marksList) {
            if (mark.getObtainedMarks() != null) {
                totalObtained += mark.getObtainedMarks();
            }
            if (mark.getFullMarks() != null) {
                totalFull += mark.getFullMarks();
            }
        }

        if (totalFull > 0) {
            double percentage = (totalObtained / totalFull) * 100.0;
            tvTotalPercentage.setText(String.format("%.2f%%", percentage));
        } else {
            tvTotalPercentage.setText("--");
        }
        layoutSummary.setVisibility(View.VISIBLE);
    }

    @Override
    public void onBackPressed() {
        new AlertDialog.Builder(this)
                .setTitle("Logout")
                .setMessage("Do you want to logout?")
                .setPositiveButton("Yes", (dialog, which) -> {
                    getSharedPreferences("app_prefs", MODE_PRIVATE).edit().clear().apply();
                    startActivity(new Intent(DashboardActivity.this, LoginActivity.class));
                    finish();
                })
                .setNegativeButton("No", null)
                .show();
    }

    // RecyclerView Adapter
    private static class MarksAdapter extends RecyclerView.Adapter<MarksAdapter.ViewHolder> {
        private final List<StudentMarksDto.MarkDto> marks;

        MarksAdapter(List<StudentMarksDto.MarkDto> marks) {
            this.marks = marks;
        }

        @NonNull
        @Override
        public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
            View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_mark, parent, false);
            return new ViewHolder(view);
        }

        @Override
        public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
            StudentMarksDto.MarkDto mark = marks.get(position);
            holder.tvSubjectName.setText(mark.getSubjectName());
            holder.tvMarksObtained.setText(formatMark(mark.getObtainedMarks()));

            String remark = getRemark(mark);
            holder.tvRemark.setText(remark);
            if ("Pass".equals(remark)) {
                holder.tvRemark.setTextColor(Color.parseColor("#2E7D32"));
            } else if ("Fail".equals(remark)) {
                holder.tvRemark.setTextColor(Color.parseColor("#C62828"));
            } else {
                holder.tvRemark.setTextColor(Color.parseColor("#7C8AA5"));
            }
        }

        @Override
        public int getItemCount() {
            return marks.size();
        }

        static class ViewHolder extends RecyclerView.ViewHolder {
            TextView tvSubjectName, tvMarksObtained, tvRemark;

            ViewHolder(View itemView) {
                super(itemView);
                tvSubjectName = itemView.findViewById(R.id.tvSubjectName);
                tvMarksObtained = itemView.findViewById(R.id.tvMarksObtained);
                tvRemark = itemView.findViewById(R.id.tvRemark);
            }
        }

        private static String getRemark(StudentMarksDto.MarkDto mark) {
            if (mark.getObtainedMarks() == null || mark.getPassMarks() == null) {
                return "-";
            }
            return mark.getObtainedMarks() >= mark.getPassMarks() ? "Pass" : "Fail";
        }

        private static String formatMark(Double value) {
            if (value == null) {
                return "-";
            }
            if (Math.abs(value - Math.round(value)) < 0.01) {
                return String.format("%.0f", value);
            }
            return String.format("%.1f", value);
        }
    }
}
