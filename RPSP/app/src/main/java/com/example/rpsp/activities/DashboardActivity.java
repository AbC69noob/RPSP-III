package com.example.rpsp.activities;

import android.content.ContentValues;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Typeface;
import android.graphics.pdf.PdfDocument;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
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
import java.io.IOException;
import java.io.OutputStream;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class DashboardActivity extends AppCompatActivity {

    private TextView tvStudentName, tvRollNumber, tvProgram, tvBatch, tvTotalPercentage;
    private View layoutSummary;
    private Spinner spinnerSemester, spinnerTerm;
    private Button btnViewResults;
    private Button btnDownloadPdf;
    private RecyclerView rvMarks;
    private ProgressBar progressBar;

    private ApiService apiService;
    private String token;
    private StudentMarksDto currentResult;
    private List<StudentMarksDto.MarkDto> currentMarks;
    private double totalObtained;
    private double totalFull;
    private double totalPercentage;

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
        btnDownloadPdf = findViewById(R.id.btnDownloadPdf);
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
        btnDownloadPdf.setEnabled(false);
        btnDownloadPdf.setOnClickListener(v -> downloadPdf());
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
        btnDownloadPdf.setEnabled(false);
        currentResult = null;
        currentMarks = null;
        totalObtained = 0.0;
        totalFull = 0.0;
        totalPercentage = 0.0;

        apiService.getMyMarks(token, semester.getId(), term.getId()).enqueue(new Callback<List<StudentMarksDto>>() {
            @Override
            public void onResponse(Call<List<StudentMarksDto>> call, Response<List<StudentMarksDto>> response) {
                progressBar.setVisibility(View.GONE);
                if (response.isSuccessful() && response.body() != null && !response.body().isEmpty()) {
                    StudentMarksDto data = response.body().get(0);
                    List<StudentMarksDto.MarkDto> marksList = data.getMarksList();
                    currentResult = data;
                    currentMarks = marksList;

                    if (marksList != null && !marksList.isEmpty()) {
                        MarksAdapter adapter = new MarksAdapter(marksList);
                        rvMarks.setAdapter(adapter);
                        updateTotalPercentage(marksList);
                        btnDownloadPdf.setEnabled(true);
                    } else {
                        btnDownloadPdf.setEnabled(false);
                        Toast.makeText(DashboardActivity.this, "No marks found for this criteria", Toast.LENGTH_SHORT)
                                .show();
                    }
                } else {
                    btnDownloadPdf.setEnabled(false);
                    Toast.makeText(DashboardActivity.this, "No results found. Are they published?", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<List<StudentMarksDto>> call, Throwable t) {
                progressBar.setVisibility(View.GONE);
                btnDownloadPdf.setEnabled(false);
                Toast.makeText(DashboardActivity.this, "Error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void updateTotalPercentage(List<StudentMarksDto.MarkDto> marksList) {
        double obtained = 0.0;
        double full = 0.0;
        for (StudentMarksDto.MarkDto mark : marksList) {
            if (mark.getObtainedMarks() != null) {
                obtained += mark.getObtainedMarks();
            }
            if (mark.getFullMarks() != null) {
                full += mark.getFullMarks();
            }
        }

        totalObtained = obtained;
        totalFull = full;

        if (full > 0) {
            totalPercentage = (obtained / full) * 100.0;
            tvTotalPercentage.setText(String.format(Locale.getDefault(), "%.2f%%", totalPercentage));
        } else {
            totalPercentage = 0.0;
            tvTotalPercentage.setText("--");
        }
        layoutSummary.setVisibility(View.VISIBLE);
    }

    private void downloadPdf() {
        if (currentResult == null || currentMarks == null || currentMarks.isEmpty()) {
            Toast.makeText(this, "No results to download", Toast.LENGTH_SHORT).show();
            return;
        }

        PdfDocument document = null;
        OutputStream outputStream = null;
        Uri uri = null;

        try {
            document = buildPdfDocument();
            String fileName = buildPdfFileName();

            ContentValues values = new ContentValues();
            values.put(MediaStore.MediaColumns.DISPLAY_NAME, fileName);
            values.put(MediaStore.MediaColumns.MIME_TYPE, "application/pdf");
            values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/RPSP");
            values.put(MediaStore.MediaColumns.IS_PENDING, 1);

            uri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
            if (uri == null) {
                Toast.makeText(this, "Unable to create PDF file", Toast.LENGTH_SHORT).show();
                return;
            }

            outputStream = getContentResolver().openOutputStream(uri);
            if (outputStream == null) {
                Toast.makeText(this, "Unable to write PDF file", Toast.LENGTH_SHORT).show();
                return;
            }

            document.writeTo(outputStream);

            ContentValues update = new ContentValues();
            update.put(MediaStore.MediaColumns.IS_PENDING, 0);
            getContentResolver().update(uri, update, null, null);

            Toast.makeText(this, "PDF saved to Downloads/RPSP", Toast.LENGTH_LONG).show();
        } catch (IOException e) {
            Toast.makeText(this, "Failed to save PDF: " + e.getMessage(), Toast.LENGTH_LONG).show();
        } finally {
            if (outputStream != null) {
                try {
                    outputStream.close();
                } catch (IOException ignored) {
                }
            }
            if (document != null) {
                document.close();
            }
        }
    }

    private PdfDocument buildPdfDocument() {
        PdfDocument document = new PdfDocument();

        final int pageWidth = 595;
        final int pageHeight = 842;
        final int margin = 40;
        final int contentWidth = pageWidth - (margin * 2);
        final int subjectWidth = Math.round(contentWidth * 0.55f);
        final int marksWidth = Math.round(contentWidth * 0.2f);
        final int remarkWidth = contentWidth - subjectWidth - marksWidth;
        final int colSubjectX = margin;
        final int colMarksX = margin + subjectWidth;
        final int colRemarkX = colMarksX + marksWidth;

        Paint titlePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        titlePaint.setTextSize(18f);
        titlePaint.setTypeface(Typeface.create(Typeface.DEFAULT, Typeface.BOLD));
        titlePaint.setColor(Color.BLACK);

        Paint textPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        textPaint.setTextSize(12f);
        textPaint.setColor(Color.BLACK);

        Paint headerPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        headerPaint.setTextSize(12f);
        headerPaint.setTypeface(Typeface.create(Typeface.DEFAULT, Typeface.BOLD));
        headerPaint.setColor(Color.BLACK);

        Paint labelPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        labelPaint.setTextSize(11f);
        labelPaint.setColor(Color.DKGRAY);

        Paint linePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        linePaint.setColor(Color.LTGRAY);
        linePaint.setStrokeWidth(1f);

        String generatedDate = new SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.getDefault()).format(new Date());

        int pageNumber = 1;
        PdfDocument.Page page = document.startPage(new PdfDocument.PageInfo.Builder(pageWidth, pageHeight, pageNumber).create());
        Canvas canvas = page.getCanvas();
        int y = drawHeader(canvas, margin, pageWidth, titlePaint, textPaint, labelPaint, headerPaint, linePaint,
                colSubjectX, colMarksX, colRemarkX, marksWidth, remarkWidth, generatedDate, true);

        int rowHeight = 18;
        for (StudentMarksDto.MarkDto mark : currentMarks) {
            if (y + rowHeight > pageHeight - margin) {
                document.finishPage(page);
                pageNumber++;
                page = document.startPage(new PdfDocument.PageInfo.Builder(pageWidth, pageHeight, pageNumber).create());
                canvas = page.getCanvas();
                y = drawHeader(canvas, margin, pageWidth, titlePaint, textPaint, labelPaint, headerPaint, linePaint,
                        colSubjectX, colMarksX, colRemarkX, marksWidth, remarkWidth, generatedDate, true);
            }

            String subject = ellipsize(mark.getSubjectName(), textPaint, subjectWidth - 6);
            canvas.drawText(subject, colSubjectX, y, textPaint);

            String marksText = formatMark(mark.getObtainedMarks());
            drawRightAlignedText(canvas, textPaint, marksText, colMarksX + marksWidth - 4, y);

            String remark = getRemark(mark);
            drawRightAlignedText(canvas, textPaint, remark, colRemarkX + remarkWidth - 4, y);
            y += rowHeight;
        }

        int summaryHeight = 50;
        if (y + summaryHeight > pageHeight - margin) {
            document.finishPage(page);
            pageNumber++;
            page = document.startPage(new PdfDocument.PageInfo.Builder(pageWidth, pageHeight, pageNumber).create());
            canvas = page.getCanvas();
            y = drawHeader(canvas, margin, pageWidth, titlePaint, textPaint, labelPaint, headerPaint, linePaint,
                    colSubjectX, colMarksX, colRemarkX, marksWidth, remarkWidth, generatedDate, false);
        } else {
            y += 8;
        }

        canvas.drawLine(margin, y, pageWidth - margin, y, linePaint);
        y += 16;
        canvas.drawText("Total Obtained", colSubjectX, y, headerPaint);
        drawRightAlignedText(canvas, headerPaint, String.format(Locale.getDefault(), "%.2f", totalObtained),
                pageWidth - margin, y);
        y += rowHeight;
        canvas.drawText("Total Percentage", colSubjectX, y, headerPaint);
        String percentageText = totalFull > 0 ? String.format(Locale.getDefault(), "%.2f%%", totalPercentage) : "--";
        drawRightAlignedText(canvas, headerPaint, percentageText, pageWidth - margin, y);

        document.finishPage(page);
        return document;
    }

    private int drawHeader(
            Canvas canvas,
            int margin,
            int pageWidth,
            Paint titlePaint,
            Paint textPaint,
            Paint labelPaint,
            Paint headerPaint,
            Paint linePaint,
            int colSubjectX,
            int colMarksX,
            int colRemarkX,
            int marksWidth,
            int remarkWidth,
            String generatedDate,
            boolean includeTableHeader
    ) {
        int y = margin;
        canvas.drawText("Result Sheet", margin, y, titlePaint);
        y += 24;
        canvas.drawText("Student: " + safeText(currentResult.getStudentName()), margin, y, textPaint);
        y += 16;
        canvas.drawText("Roll No: " + safeText(currentResult.getRollNo()), margin, y, textPaint);
        y += 16;
        canvas.drawText("Generated: " + generatedDate, margin, y, labelPaint);
        y += 16;

        if (includeTableHeader) {
            y += 8;
            canvas.drawLine(margin, y, pageWidth - margin, y, linePaint);
            y += 16;
            canvas.drawText("Subject", colSubjectX, y, headerPaint);
            drawRightAlignedText(canvas, headerPaint, "Marks", colMarksX + marksWidth - 4, y);
            drawRightAlignedText(canvas, headerPaint, "Remark", colRemarkX + remarkWidth - 4, y);
            y += 6;
            canvas.drawLine(margin, y, pageWidth - margin, y, linePaint);
            y += 16;
        } else {
            y += 12;
        }

        return y;
    }

    private static String safeText(String text) {
        return text == null ? "-" : text;
    }

    private static void drawRightAlignedText(Canvas canvas, Paint paint, String text, int rightX, int y) {
        if (text == null) {
            text = "-";
        }
        canvas.drawText(text, rightX - paint.measureText(text), y, paint);
    }

    private static String ellipsize(String text, Paint paint, int maxWidth) {
        if (text == null) return "-";
        if (paint.measureText(text) <= maxWidth) return text;
        String ellipsis = "...";
        int cut = text.length();
        while (cut > 0 && paint.measureText(text, 0, cut) + paint.measureText(ellipsis) > maxWidth) {
            cut--;
        }
        return text.substring(0, Math.max(0, cut)) + ellipsis;
    }

    private String buildPdfFileName() {
        String roll = currentResult != null && currentResult.getRollNo() != null ? currentResult.getRollNo() : "student";
        roll = roll.replaceAll("[^a-zA-Z0-9_-]", "");
        String timestamp = new SimpleDateFormat("yyyyMMdd_HHmm", Locale.getDefault()).format(new Date());
        return "result_" + roll + "_" + timestamp + ".pdf";
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
            return String.format(Locale.getDefault(), "%.0f", value);
        }
        return String.format(Locale.getDefault(), "%.1f", value);
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
