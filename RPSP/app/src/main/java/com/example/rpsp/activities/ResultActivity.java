package com.example.rpsp.activities;

import android.graphics.Color;
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

    private TextView tvStudentName, tvRollNo, tvTotalObtained, tvTotalPercentage;
    private RecyclerView rvMarks;
    private MarksAdapter adapter;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_result);

        tvStudentName = findViewById(R.id.tvStudentName);
        tvRollNo = findViewById(R.id.tvRollNo);
        tvTotalObtained = findViewById(R.id.tvTotalObtained);
        tvTotalPercentage = findViewById(R.id.tvTotalPercentage);
        rvMarks = findViewById(R.id.rvMarks);

        rvMarks.setLayoutManager(new LinearLayoutManager(this));

        Long semesterId = getIntent().getLongExtra("semesterId", -1L);
        Long termId = getIntent().getLongExtra("termId", -1L);

        String token = getSharedPreferences("app_prefs", MODE_PRIVATE).getString("token", "");

        ApiClient.getService().getMyMarks(token, semesterId, termId).enqueue(new Callback<List<StudentMarksDto>>() {
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

                        double totalFull = data.getMarksList().stream()
                                .mapToDouble(mark -> mark.getFullMarks() == null ? 0.0 : mark.getFullMarks())
                                .sum();
                        if (totalFull > 0) {
                            double percentage = (total / totalFull) * 100.0;
                            tvTotalPercentage.setText(String.format("%.2f%%", percentage));
                        } else {
                            tvTotalPercentage.setText("--");
                        }
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
