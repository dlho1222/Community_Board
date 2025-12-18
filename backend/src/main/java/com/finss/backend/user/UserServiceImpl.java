package com.finss.backend.user;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    public void register(UserRegisterRequest request) {
        // 사용자 이름 중복 확인
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new IllegalArgumentException("이미 사용 중인 사용자 이름입니다.");
        }

        // 이메일 중복 확인
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }

        // 사용자 저장 (비밀번호는 암호화되지 않은 상태로 저장됨)
        User newUser = User.builder()
                .username(request.getUsername())
                .password(request.getPassword())
                .email(request.getEmail())
                .build();
        userRepository.save(newUser);
    }

    @Override
    @Transactional(readOnly = true) // Read-only transaction for login
    public User login(UserLoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("가입되지 않은 이메일입니다."));

        if (!user.getPassword().equals(request.getPassword())) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }

        return user;
    }

    @Override
    public User update(Long id, UserUpdateRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        // Update username if provided and different
        if (request.getUsername() != null && !request.getUsername().trim().isEmpty()) {
            if (!user.getUsername().equals(request.getUsername())) {
                // Check for duplicate username
                if (userRepository.findByUsername(request.getUsername()).isPresent()) {
                    throw new IllegalArgumentException("이미 사용 중인 사용자 이름입니다.");
                }
                user.setUsername(request.getUsername());
            }
        }

        // Update password if provided
        if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {

            user.setPassword(request.getPassword());
        }

                return userRepository.save(user);

            }

        

            @Override

            @Transactional(readOnly = true)

            public User findById(Long id) {

                return userRepository.findById(id)

                        .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

            }

        }

        