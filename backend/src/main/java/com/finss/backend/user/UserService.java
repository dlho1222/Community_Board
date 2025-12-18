package com.finss.backend.user;

public interface UserService {
    void register(UserRegisterRequest request);
    User login(UserLoginRequest request);
    User update(Long id, UserUpdateRequest request);
    User findById(Long id);
}
