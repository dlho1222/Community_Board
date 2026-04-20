package com.finss.backend.user;

import com.finss.backend.admin.AdminUserDetailResponse;
import com.finss.backend.admin.AdminUserUpdateRequest;
import com.finss.backend.comment.CommentResponse;
import com.finss.backend.comment.CommentService;
import com.finss.backend.post.PostResponse;
import com.finss.backend.post.PostService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PostService postService;
    private final CommentService commentService;
    private final PasswordEncoder passwordEncoder;

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int LOCK_TIME_DURATION_MINUTES = 30;

    @Override
    public void register(UserRegisterRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new IllegalArgumentException("이미 사용 중인 사용자 이름입니다.");
        }

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }

        // 비즈니스 로직 설계 오류 해결
        // 특정 아이디(admin 등)에 따른 자동 권한 부여 로직을 삭제하고, 
        // 모든 신규 가입자는 기본적으로 일반 사용자(USER) 권한을 갖도록 설정
        String role = UserRole.USER.name();
        
        User newUser = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .email(request.getEmail())
                .role(role)
                .build();
        userRepository.save(newUser);
    }

    @Override
    @Transactional(noRollbackFor = {IllegalArgumentException.class, IllegalStateException.class})
    public User authenticate(UserLoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> {
                    log.warn("로그인 실패: 존재하지 않는 이메일 시도 - {}", request.getEmail());
                    return new IllegalArgumentException("이메일 또는 비밀번호가 올바르지 않습니다.");
                });

        checkLockout(user);

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            increaseFailedAttempts(user);
            int currentAttempts = user.getFailedLoginAttempts();
            log.warn("로그인 실패: 비밀번호 불일치 - 이메일: {}, 실패 횟수: {}", request.getEmail(), currentAttempts);
            
            if (currentAttempts >= MAX_FAILED_ATTEMPTS) {
                throw new IllegalStateException("인증 시도 횟수 초과로 인해 계정이 잠겼습니다. 30분 후에 다시 시도해주세요.");
            }
            
            throw new IllegalArgumentException(String.format("이메일 또는 비밀번호가 올바르지 않습니다. (실패 횟수: %d/%d)", currentAttempts, MAX_FAILED_ATTEMPTS));
        }

        resetFailedAttempts(user);
        return user;
    }

    private void checkLockout(User user) {
        if (user.getLockoutTime() != null) {
            if (user.getLockoutTime().isAfter(LocalDateTime.now())) {
                log.warn("로그인 차단: 잠긴 계정 접속 시도 - {}", user.getEmail());
                throw new IllegalStateException("인증 시도 횟수 초과로 인해 계정이 잠겼습니다. 30분 후에 다시 시도해주세요.");
            } else {
                // 잠금 시간 경과 시 초기화
                user.setLockoutTime(null);
                user.setFailedLoginAttempts(0);
                userRepository.save(user);
            }
        }
    }

    private void increaseFailedAttempts(User user) {
        int newAttempts = user.getFailedLoginAttempts() + 1;
        user.setFailedLoginAttempts(newAttempts);
        
        if (newAttempts >= MAX_FAILED_ATTEMPTS) {
            user.setLockoutTime(LocalDateTime.now().plusMinutes(LOCK_TIME_DURATION_MINUTES));
            log.warn("계정 잠금 발생: 이메일 - {}", user.getEmail());
        }
        userRepository.saveAndFlush(user); // 즉시 반영
    }

    private void resetFailedAttempts(User user) {
        if (user.getFailedLoginAttempts() > 0 || user.getLockoutTime() != null) {
            user.setFailedLoginAttempts(0);
            user.setLockoutTime(null);
            userRepository.saveAndFlush(user); // 즉시 반영
        }
    }

    @Override
    public UserResponse update(Long id, UserUpdateRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        if (request.getUsername() != null && !request.getUsername().trim().isEmpty()) {
            if (!user.getUsername().equals(request.getUsername())) {
                if (userRepository.findByUsername(request.getUsername()).isPresent()) {
                    throw new IllegalArgumentException("이미 사용 중인 사용자 이름입니다.");
                }
                user.setUsername(request.getUsername());
            }
        }

        if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {

            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        User savedUser = userRepository.save(user);
        return UserResponse.fromEntity(savedUser);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse findById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        return UserResponse.fromEntity(user);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> findAll() {
        return userRepository.findAll().stream()
                .map(UserResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    public UserResponse adminUpdateUser(Long userId, AdminUserUpdateRequest request) {
        User userToUpdate = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        String newUsername = request.getUsername();
        if (newUsername != null && !newUsername.trim().isEmpty() && !newUsername.equals(userToUpdate.getUsername())) {
            if (userRepository.findByUsername(newUsername).isPresent()) {
                throw new IllegalArgumentException("이미 사용 중인 사용자 이름입니다.");
            }
            userToUpdate.setUsername(newUsername);
        }

        User savedUser = userRepository.save(userToUpdate);
        return UserResponse.fromEntity(savedUser);
    }

    @Override
    public void resetPasswordByAdmin(Long userId, String newPassword) {
        if (newPassword == null || newPassword.trim().isEmpty()) {
            throw new IllegalArgumentException("새 비밀번호는 비어 있을 수 없습니다.");
        }
        User userToUpdate = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        userToUpdate.setPassword(passwordEncoder.encode(newPassword.trim()));
        userRepository.save(userToUpdate);
    }

    @Override
    @Transactional(readOnly = true)
    public AdminUserDetailResponse getAdminUserDetails(Long userId, Long adminId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        List<PostResponse> posts = postService.getPostsByUserId(userId, adminId, true);
        List<CommentResponse> comments = commentService.getCommentsByUserId(userId, adminId, true);
        //builder 패턴 - 객체를 생성할 때의 명확성과 안정성을 위해 사용
        return AdminUserDetailResponse.builder()
                .user(UserResponse.fromEntity(user))
                .posts(posts)
                .comments(comments)
                .build();
    }
}