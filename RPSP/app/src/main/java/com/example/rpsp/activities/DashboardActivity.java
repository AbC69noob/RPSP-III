package com.example.rpsp.activities;

import android.content.Intent;
import android.content.SharedPreferences;
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
import com.example.rpsp.model.ProfileDto;
import com.example.rpsp.model.StudentDetailsDto;
import com.example.rpsp.model.StudentMarksDto;
import com.example.rpsp.model.Term;
import java.util.ArrayList;
import java.util.List;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class DashboardActivity extends AppCompatActivity {

    private TextView tvStudentName, tvRollNumber, tvProgram, tvBatch;
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

        rvMarks.setLayoutManager(new LinearLayoutManager(this));

        SharedPreferences prefs = getSharedPreferences("app_prefs", MODE_PRIVATE);
        token = prefs.getString("token", "");

        if (token.isEmpty()) {
            startActivity(new Intent(this, LoginActivity.class));
            finish();
            return;
        }

        apiService = ApiClient.getService();

        setupSemesters();
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

    private void setupSemesters() {
        List<Integer> semesters = new ArrayList<>();
        for (int i = 1; i <= 8; i++)
            semesters.add(i);
        ArrayAdapter<Integer> adapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_dropdown_item,
                semesters);
        spinnerSemester.setAdapter(adapter);
    }

    private void fetchTerms() {
        apiService.getTerms(token).enqueue(new Callback<List<Term>>() {
            @Override
            public void onResponse(Call<List<Term>> call, Response<List<Term>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    ArrayAdapter<Term> adapter = new ArrayAdapter<>(DashboardActivity.this,
                            android.R.layout.simple_spinner_dropdown_item, response.body());
                    spinnerTerm.setAdapter(adapter);
                } else {
                    Toast.makeText(DashboardActivity.this, "Failed to load terms", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<List<Term>> call, Throwable t) {
                Toast.makeText(DashboardActivity.this, "Term Error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void fetchResults() {
        Integer semester = (Integer) spinnerSemester.getSelectedItem();
        Term term = (Term) spinnerTerm.getSelectedItem();

        if (semester == null || term == null) {
            Toast.makeText(this, "Please select semester and term", Toast.LENGTH_SHORT).show();
            return;
        }

        progressBar.setVisibility(View.VISIBLE);
        rvMarks.setAdapter(null); // Clear previous results

        apiService.getMyMarks(token, semester, term.getId()).enqueue(new Callback<List<StudentMarksDto>>() {
            @Override
            public void onResponse(Call<List<StudentMarksDto>> call, Response<List<StudentMarksDto>> response) {
                progressBar.setVisibility(View.GONE);
                if (response.isSuccessful() && response.body() != null && !response.body().isEmpty()) {
                    StudentMarksDto data = response.body().get(0);
                    List<StudentMarksDto.MarkDto> marksList = data.getMarksList();

                    if (marksList != null && !marksList.isEmpty()) {
                        MarksAdapter adapter = new MarksAdapter(marksList);
                        rvMarks.setAdapter(adapter);
                    } else {
                        Toast.makeText(DashboardActivity.this, "No marks found for this criteria", Toast.LENGTH_SHORT)
                                .show();
                    }
                } else {
                    Toast.makeText(DashboardActivity.this, "No results found", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<List<StudentMarksDto>> call, Throwable t) {
                progressBar.setVisibility(View.GONE);
                Toast.makeText(DashboardActivity.this, "Error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
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
            holder.tvMarksObtained.setText(String.format("%.1f / %.1f", mark.getObtainedMarks(), mark.getFullMarks()));
        }

        @Override
        public int getItemCount() {
            return marks.size();
        }

        static class ViewHolder extends RecyclerView.ViewHolder {
            TextView tvSubjectName, tvMarksObtained;

            ViewHolder(View itemView) {
                super(itemView);
                tvSubjectName = itemView.findViewById(R.id.tvSubjectName);
                tvMarksObtained = itemView.findViewById(R.id.tvMarksObtained);
            }
        }
    }
}
