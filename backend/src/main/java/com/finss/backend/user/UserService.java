package com.finss.backend.user;

import com.finss.backend.admin.AdminUserUpdateRequest;
import java.util.List;

public interface UserService {
    void register(UserRegisterRequest request);
    User login(UserLoginRequest request);
    User update(Long id, UserUpdateRequest request);
    User findById(Long id);

    List<User> findAll();
    User adminUpdateUser(Long userId, AdminUserUpdateRequest request);
    void resetPasswordByAdmin(Long userId, String newPassword);
}
