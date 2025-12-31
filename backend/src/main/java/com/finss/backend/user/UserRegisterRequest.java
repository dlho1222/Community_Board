package com.finss.backend.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
//클라이언트가 보내는 데이터 형식을 정의하는 클래스 (역직렬화에 사용되는 클래스)
//DTO Class
@Getter // getter 생성
@Setter // setter 생성
@NoArgsConstructor // 파라미터가 없는 기본 생성자 생성
public class UserRegisterRequest {
    //공백을 제외한 값이 존재하는 문자열 유효성 검사
    @NotBlank(message = "사용자 이름은 필수입니다.")
    //문자열 길이 또는 컬렉션 크기 범위 유효성 검사
    @Size(min = 2, max = 10, message = "사용자 이름은 2자 이상 10자 이하이어야 합니다.")
    private String username;

    @NotBlank(message = "비밀번호는 필수입니다.")
    @Size(min = 4, message = "비밀번호는 4자 이상이어야 합니다.")
    private String password;

    @NotBlank(message = "이메일은 필수입니다.")
    //이메일 형식 유효성 검사
    @Email(message = "유효한 이메일 형식이 아닙니다.")
    private String email;
}
