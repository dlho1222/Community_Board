package com.finss.backend.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
//클라이언트가 보내는 데이터 형식을 정의하는 파일 클라이언트 -> 서버 역직렬화(JSON -> 객체) ,  (서버 -> 클라이언트 - Response 직렬화)
@Getter
@Setter
@NoArgsConstructor
public class UserRegisterRequest {

    @NotBlank(message = "사용자 이름은 필수입니다.")
    @Size(min = 2, max = 20, message = "사용자 이름은 2자 이상 20자 이하이어야 합니다.")
    private String username;

    @NotBlank(message = "비밀번호는 필수입니다.")
    @Size(min = 8, message = "비밀번호는 8자 이상이어야 합니다.")
    private String password;

    @NotBlank(message = "이메일은 필수입니다.")
    @Email(message = "유효한 이메일 형식이 아닙니다.")
    private String email;
}
