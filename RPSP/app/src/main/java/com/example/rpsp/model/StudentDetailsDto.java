package com.example.rpsp.model;

import com.google.gson.annotations.SerializedName;

public class StudentDetailsDto {
    @SerializedName("rollNo")
    private String rollNo;

    @SerializedName("programName")
    private String programName;

    @SerializedName("batchName")
    private String batchName;

    public String getRollNo() {
        return rollNo;
    }

    public String getProgramName() {
        return programName;
    }

    public String getBatchName() {
        return batchName;
    }
}
