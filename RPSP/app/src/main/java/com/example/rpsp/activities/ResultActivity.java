package com.example.rpsp.activities;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.example.rpsp.R;
import com.example.rpsp.api.ApiClient;
import com.example.rpsp.model.StudentMarksDto;
import java.util.List;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ResultActivity extends AppCompatActivity {

    private TextView tvStudentName, tvRollNo, tvTotalObtained;
    private RecyclerView rvMarks;
    private MarksAdapter adapter;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_result);

        tvStudentName = findViewById(R.id.tvStudentName);
        tvRollNo = findViewById(R.id.tvRollNo);
        tvTotalObtained = findViewById(R.id.tvTotalObtained);
        rvMarks = findViewById(R.id.rvMarks);

        rvMarks.setLayoutManager(new LinearLayoutManager(this));

        int semester = getIntent().getIntExtra("semester", 1);
        Long termId = getIntent().getLongExtra("termId", -1);

        String token = getSharedPreferences("app_prefs", MODE_PRIVATE).getString("token", "");

        ApiClient.getService().getMyMarks(token, semester, termId).enqueue(new Callback<List<StudentMarksDto>>() {
            @Override
            public void onResponse(Call<List<StudentMarksDto>> call, Response<List<StudentMarksDto>> response) {
                if (response.isSuccessful() && response.body() != null && !response.body().isEmpty()) {
                    StudentMarksDto data = response.body().get(0);
                    tvStudentName.setText(data.getStudentName());
                    tvRollNo.setText("Roll No: " + data.getRollNo());

                    if (data.getMarksList() != null) {
                        adapter = new MarksAdapter(data.getMarksList());
                        rvMarks.setAdapter(adapter);

                        double total = data.getMarksList().stream()
                                .mapToDouble(StudentMarksDto.MarkDto::getObtainedMarks)
                                .sum();
                        tvTotalObtained.setText(String.format("%.2f", total));
                    }
                } else {
                    Toast.makeText(ResultActivity.this, "No results found", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<List<StudentMarksDto>> call, Throwable t) {
                Toast.makeText(ResultActivity.this, "Error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }

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
