package com.finss.backend.user;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
/*
 회원가입 요청 처리 (Controller)
 1. 클라이언트(프론트엔드)가 POST /api/users/register 엔드포인트로 사용자 정보(username, password, email)를 JSON 형식으로 보냄
 2. UserController.java가 이 요청을 받음
 3. @Valid 어노테이션이 UserRegisterRequest.java에 정의된 유효성 검사 규칙(예: @NotBlank, @Size, @Email)에 따라 요청 데이터가 유효한지 자동으로 검사
 4. 유효성 검사를 통과하면, registerUser 메소드는 UserService.java의 register 메소드를 호출하여 실제 회원가입 비즈니스 로직을 위임
 @RequestBody 어노테이션으로
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<String> registerUser(@Valid @RequestBody UserRegisterRequest request) {
        userService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body("회원가입이 성공적으로 완료되었습니다.");
    }

    @PostMapping("/login")
    public ResponseEntity<User> loginUser(@Valid @RequestBody UserLoginRequest request) {
        User user = userService.login(request);
        return ResponseEntity.ok(user);
    }

    @PostMapping("/logout")
    public ResponseEntity<String> logoutUser() {
        // TODO: 세션 기반 인증 시 로그아웃 처리 추가
        return ResponseEntity.ok("로그아웃 되었습니다.");
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> handleIllegalArgumentException(IllegalArgumentException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
    }
}
