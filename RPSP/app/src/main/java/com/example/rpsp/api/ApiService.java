package com.example.rpsp.api;

import com.example.rpsp.model.LoginRequest;
import com.example.rpsp.model.LoginResponse;
import com.example.rpsp.model.ProfileDto;
import com.example.rpsp.model.StudentMarksDto;
import com.example.rpsp.model.Term;
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
    Call<String> changePassword(@Header("Authorization") String token, @Body Map<String, String> request);

    @GET("/profile")
    Call<ProfileDto> getProfile(@Header("Authorization") String token);

    @GET("/terms")
    Call<List<Term>> getTerms(@Header("Authorization") String token);

    @GET("/marks/my-marks")
    Call<List<StudentMarksDto>> getMyMarks(
            @Header("Authorization") String token,
            @Query("semester") int semester,
            @Query("termId") Long termId);
}
