package com.finss.backend.user;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
//DTO
@Getter
@Setter
public class UserUpdateRequest {

    @Size(min = 2, max = 10, message = "사용자 이름은 2자 이상 10자 이하로 입력해주세요.")
    private String username;

    @Size(min = 4, max = 20, message = "비밀번호는 4자 이상 20자 이하로 입력해주세요.")
    private String password;
}
