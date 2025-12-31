package com.finss.backend.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

//DTO Class
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
//HttpMessageConverter에 의해 직렬화 하는데 사용되는 클래스
public class UserResponse {
    private Long id;
    private String username;
    private String email;
    private String role;
    //Service의 처리 결과를 Controller에서 클라이언트에게 응답하기 위한 DTO 객체로 변환하기 위한 메서드
    public static UserResponse fromEntity(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }
}
