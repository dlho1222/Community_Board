package com.finss.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.csrf.CsrfToken;

import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        // SPA(React)에서 CSRF 토큰을 처리하기 위한 핸들러 설정
        CsrfTokenRequestAttributeHandler requestHandler = new CsrfTokenRequestAttributeHandler();
        // Plain text로 토큰을 다루지 않고, 헤더/파라미터에서 읽어오도록 설정
        requestHandler.setCsrfRequestAttributeName(null);

        http
            .cors(Customizer.withDefaults()) // CORS 설정 활성화
            .csrf(csrf -> csrf
                // 로그인과 회원가입 요청은 CSRF 검증에서 제외
                .ignoringRequestMatchers(
                    new AntPathRequestMatcher("/api/users/login"),
                    new AntPathRequestMatcher("/api/users/register")
                )
                // 쿠키 기반 CSRF 토큰 저장소 설정 (HttpOnly=false)
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                .csrfTokenRequestHandler(requestHandler)
            )
            .authorizeHttpRequests(auth -> auth
                .anyRequest().permitAll()
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                .sessionFixation().changeSessionId()
            )
            // 매 요청마다 CSRF 토큰을 강제로 로드하여 응답 쿠키에 포함되도록 함
            .addFilterAfter((request, response, chain) -> {
                CsrfToken token = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
                if (token != null) {
                    token.getToken(); // 토큰을 명시적으로 로드
                }
                chain.doFilter(request, response);
            }, UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
}
