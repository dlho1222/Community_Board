package com.finss.backend.common;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * 정보 노출 방지]
     * 모든 예상치 못한 예외(Exception)를 처리하여 서버 내부 정보를 은폐
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleAllExceptions(Exception e) {
        // 1. 서버 콘솔/로그에는 상세 에러를 기록 (개발자용)
        e.printStackTrace(); 
        
        // 2. 외부(브라우저)로는 상세 에러를 절대 노출하지 않고 추상적인 메시지만 전달 (보안용)
        // 공격자가 스택 트레이스를 통해 서버 구조(DB 테이블명, 파일 경로 등)를 파악하는 것을 차단
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    }

    /**
     * 비즈니스 로직 상의 잘못된 인자 예외 처리 (IllegalArgumentException)
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> handleIllegalArgumentException(IllegalArgumentException e) {
        // 사용자 입력 값 오류 등은 보안상 민감한 정보가 아니므로 메시지를 그대로 전달해도 무방
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
    }

    /**
     * 권한 부족 예외 처리 (AccessDeniedException)
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<String> handleAccessDeniedException(AccessDeniedException e) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
    }

    /**
     * [추가] Bean Validation(@Valid) 검증 실패 시 발생하는 예외 처리
     * 사용자가 잘못된 비밀번호 형식 등을 입력했을 때, '서버 에러(500)'가 아닌 '잘못된 요청(400)'으로 응답합니다.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<String> handleValidationExceptions(MethodArgumentNotValidException e) {
        // DTO에 적어둔 에러 메시지 중 첫 번째 것을 가져옵니다.
        String errorMessage = e.getBindingResult().getAllErrors().get(0).getDefaultMessage();
        
        // 400 Bad Request와 함께 정확한 가이드 메시지 전달
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorMessage);
    }
}
