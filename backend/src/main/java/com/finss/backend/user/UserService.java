package com.finss.backend.user;

import com.finss.backend.admin.AdminUserDetailResponse;
import com.finss.backend.admin.AdminUserUpdateRequest;

import java.util.List;

public interface UserService {
    void register(UserRegisterRequest request);
    UserResponse login(UserLoginRequest request);
    UserResponse update(Long id, UserUpdateRequest request);
    UserResponse findById(Long id);

    List<UserResponse> findAll();
    UserResponse adminUpdateUser(Long userId, AdminUserUpdateRequest request);
    void resetPasswordByAdmin(Long userId, String newPassword);
    AdminUserDetailResponse getAdminUserDetails(Long userId, Long adminId);
}