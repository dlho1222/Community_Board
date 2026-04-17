package com.finss.backend.common;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * 정보 노출 방지]
     * 모든 예상치 못한 예외(Exception)를 처리하여 서버 내부 정보를 은폐
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleAllExceptions(Exception e) {
        log.error("예상치 못한 서버 오류 발생: ", e); 
        
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    }

    /**
     * 파일 처리 오류 예외 처리 (FileException - 500)
     */
    @ExceptionHandler(FileException.class)
    public ResponseEntity<String> handleFileException(FileException e) {
        log.error("파일 처리 오류: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
    }

    /**
     * 파일을 찾을 수 없는 예외 처리 (CustomFileNotFoundException - 404)
     */
    @ExceptionHandler(CustomFileNotFoundException.class)
    public ResponseEntity<String> handleCustomFileNotFoundException(CustomFileNotFoundException e) {
        log.warn("파일 미지 존재: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
    }

    /**
     * 비즈니스 로직 상의 잘못된 인자 예외 처리 (IllegalArgumentException - 400)
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> handleIllegalArgumentException(IllegalArgumentException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
    }

    /**
     * 권한 부족 예외 처리 (AccessDeniedException - 403)
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<String> handleAccessDeniedException(AccessDeniedException e) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
    }

    /**
     * [추가] Bean Validation(@Valid) 검증 실패 시 발생하는 예외 처리
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<String> handleValidationExceptions(MethodArgumentNotValidException e) {
        String errorMessage = e.getBindingResult().getAllErrors().get(0).getDefaultMessage();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorMessage);
    }
}
