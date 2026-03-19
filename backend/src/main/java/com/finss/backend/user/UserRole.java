package com.finss.backend.user;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 사용자 역할을 관리하는 열거형
 * 하드코딩된 "ADMIN", "USER" 문자열을 대체함
 */
@Getter
@RequiredArgsConstructor
public enum UserRole {
    ADMIN("ADMIN"),
    USER("USER");

    private final String value;
}
