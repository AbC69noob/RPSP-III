package com.example.rpsp.api;

import com.example.rpsp.model.LoginRequest;
import com.example.rpsp.model.LoginResponse;
import com.example.rpsp.model.ProfileDto;
import com.example.rpsp.model.StudentMarksDto;
import com.example.rpsp.model.CrTerm;
import java.util.List;
import java.util.Map;
import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.Header;
import retrofit2.http.POST;
import retrofit2.http.Query;

public interface ApiService {

    @POST("/login")
    Call<LoginResponse> login(@Body LoginRequest request);

    @POST("/users/change-password")
    Call<okhttp3.ResponseBody> changePassword(@Header("Authorization") String token, @Body Map<String, String> request);

    @POST("/auth/forgot-password")
    Call<okhttp3.ResponseBody> forgotPassword(@Body Map<String, String> request);

    @POST("/auth/verify-otp")
    Call<okhttp3.ResponseBody> verifyOtp(@Body Map<String, String> request);

    @POST("/auth/reset-password")
    Call<okhttp3.ResponseBody> resetPassword(@Body Map<String, String> request);

    @GET("/profile")
    Call<ProfileDto> getProfile(@Header("Authorization") String token);

    @GET("/cr-terms")
    Call<List<CrTerm>> getCrTerms(@Header("Authorization") String token);

    @GET("/semesters")
    Call<List<com.example.rpsp.model.Semester>> getSemesters(@Header("Authorization") String token);

    @GET("/marks/my-marks")
    Call<List<StudentMarksDto>> getMyMarks(
            @Header("Authorization") String token,
            @Query("semesterId") Long semesterId,
            @Query("crTermId") Long crTermId);
}
