package com.finss.backend.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

//DTO
@Getter
@Setter
@NoArgsConstructor //기본 생성자 자동 생성 어노테이션
@AllArgsConstructor//모든 필드를 인자로 받는 생성자 자동 생성
@Builder
public class UserResponse {
    private Long id;
    private String username;
    private String email;
    private String role;

    //Service -> Repository (Entity) -> DB -> Repository -> Service (Entity) -> Controller(DTO 변환) 직렬화 후 ResponseEntity 리턴
    public static UserResponse fromEntity(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }
}
