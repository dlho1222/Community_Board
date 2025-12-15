package com.finss.backend.user;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
/*
 보안 설정
 SecurityConfig.java에서 Spring Security 관련 설정
 비밀번호 암호화: BCryptPasswordEncoder를 PasswordEncoder 빈으로 등록하여, 사용자 비밀번호를 안전하게 암호화할 준비
 CSRF 비활성화: csrf.disable()을 통해 CSRF(Cross-Site Request Forgery) 보호 기능을 비활성화 REST API 환경에서는 보통 세션 대신 토큰 기반 인증을 사용하므로 일반적인 설정
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    //비밀번호 암호화
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // CSRF 보호 비활성화 (REST API)
                .authorizeHttpRequests(authz -> authz
                        .requestMatchers("/**").permitAll() // 우선 모든 요청을 허용
                );
        return http.build();
    }
}
