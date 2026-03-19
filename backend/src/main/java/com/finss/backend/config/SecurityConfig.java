package com.finss.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        // BCrypt는 비밀번호 해싱을 위한 강력한 알고리즘입니다. 
        // 매번 다른 솔트(Salt)를 사용하여 동일한 비밀번호라도 다른 해시값을 생성합니다.
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable) // REST API이므로 CSRF는 일단 비활성화 (나중에 별도로 다룸)
            .authorizeHttpRequests(auth -> auth
                .anyRequest().permitAll() // 현재 실습 단계이므로 모든 요청 허용
            );
        
        return http.build();
    }
}
