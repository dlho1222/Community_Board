package com.finss.backend.user;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
/*
UserService.java에서 회원가입의 핵심 로직을 처리
 1. 중복 확인: UserRepository를 사용하여 요청된 username이나 email이 데이터베이스에 이미 존재하는지 확인
       * 만약 존재한다면, IllegalArgumentException을 발생시켜 중복 가입을 막습니다.
 2. 사용자 생성: 암호화된 비밀번호와 요청받은 정보를 바탕으로 새로운 User 객체를 생성
 3. 저장: 완성된 User 객체를 UserRepository의 save 메소드를 통해 데이터베이스에 저장
 */
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    public void register(UserRegisterRequest request) {
        // 사용자 이름 중복 확인
        userRepository.findByUsername(request.getUsername()).ifPresent(user -> {
            throw new IllegalArgumentException("이미 사용 중인 사용자 이름입니다.");
        });

        // 이메일 중복 확인
        userRepository.findByEmail(request.getEmail()).ifPresent(user -> {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        });

        // 사용자 생성 및 비밀번호 암호화
        User user = User.builder()
                .username(request.getUsername())
                .password(request.getPassword())
                .email(request.getEmail())
                .build();

        // 사용자 저장
        userRepository.save(user);
    }

    @Override
    public User login(UserLoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("가입되지 않은 이메일입니다."));

        // TODO: 비밀번호 암호화 및 비교 로직 추가 필요
        if (!user.getPassword().equals(request.getPassword())) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }

        return user;
    }
}
