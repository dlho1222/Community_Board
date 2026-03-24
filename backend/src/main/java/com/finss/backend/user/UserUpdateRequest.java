package com.finss.backend.user;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
//DTO
@Getter
@Setter
public class UserUpdateRequest {

    @Size(min = 2, max = 10, message = "사용자 이름은 2자 이상 10자 이하로 입력해주세요.")
    private String username;

    @Size(min = 8, max = 20, message = "비밀번호는 8자 이상 20자 이하로 입력해주세요.")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,20}$",
        message = "비밀번호는 영문 대문자, 소문자, 숫자, 특수문자를 모두 포함해야 합니다."
    )
    private String password;
}
