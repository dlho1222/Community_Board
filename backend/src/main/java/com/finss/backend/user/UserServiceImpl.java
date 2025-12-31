package com.finss.backend.user;

import com.finss.backend.admin.AdminUserDetailResponse;
import com.finss.backend.admin.AdminUserUpdateRequest;
import com.finss.backend.comment.CommentResponse;
import com.finss.backend.comment.CommentService;
import com.finss.backend.post.PostResponse;
import com.finss.backend.post.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor //DI를 위한 생성자 자동 생성
@Transactional //메서드 실행 중에 예외가 발생되면 데이터베이스 변경 사항이 자동으로 '롤백' 되고 변경 사항을 모두 취소, 성공하면 '커밋'
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PostService postService;
    private final CommentService commentService;

    @Override
    public void register(UserRegisterRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new IllegalArgumentException("이미 사용 중인 사용자 이름입니다.");
        }

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }

        String role = "admin".equalsIgnoreCase(request.getUsername()) ? "ADMIN" : "USER";
        //DTO -> Entity 객체 생성
        User newUser = User.builder()
                .username(request.getUsername())
                .password(request.getPassword())
                .email(request.getEmail())
                .role(role)
                .build();
        userRepository.save(newUser);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse login(UserLoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("가입되지 않은 이메일입니다."));

        if (!user.getPassword().equals(request.getPassword())) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }

        return UserResponse.fromEntity(user);
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

            user.setPassword(request.getPassword());
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
        userToUpdate.setPassword(newPassword.trim());
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