package com.finss.backend.admin;

import com.finss.backend.post.PostResponse;
import com.finss.backend.post.PostService;
import com.finss.backend.user.User;
import com.finss.backend.user.UserResponse;
import com.finss.backend.user.UserService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserService userService;
    private final PostService postService;

    private User getLoginAdmin(HttpSession session) {
        User loginUser = (User) session.getAttribute("loginUser");
        if (loginUser == null || !"ADMIN".equals(loginUser.getRole())) {
            return null;
        }
        return loginUser;
    }

    // 사용자 목록 조회
    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getAllUsers(HttpSession session) {
        User admin = getLoginAdmin(session);
        if (admin == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        List<UserResponse> userResponses = userService.findAll();
        return ResponseEntity.ok(userResponses);
    }

    // 게시글 전체 목록 조회
    @GetMapping("/posts")
    public ResponseEntity<Page<PostResponse>> getAllPostsForAdmin(HttpSession session,
                                                                  Pageable pageable) {
        User admin = getLoginAdmin(session);
        if (admin == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Page<PostResponse> posts = postService.getAllPosts(admin.getId(), true, pageable);
        return ResponseEntity.ok(posts);
    }

    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<Void> deletePostByAdmin(HttpSession session,
                                                  @PathVariable Long postId) {
        User admin = getLoginAdmin(session);
        if (admin == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        postService.deletePost(postId, admin.getId(), true);
        return ResponseEntity.noContent().build();
    }

    // 사용자 정보 수정
    @PutMapping("/users/{userId}")
    public ResponseEntity<UserResponse> updateUserByAdmin(HttpSession session,
                                                          @PathVariable Long userId,
                                                          @RequestBody AdminUserUpdateRequest request) {
        User admin = getLoginAdmin(session);
        if (admin == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        UserResponse updatedUser = userService.adminUpdateUser(userId, request);
        return ResponseEntity.ok(updatedUser);
    }

    // 비밀번호 재설정
    @PutMapping("/users/{userId}/reset-password")
    public ResponseEntity<String> resetPasswordByAdmin(HttpSession session,
                                                       @PathVariable Long userId,
                                                       @RequestBody AdminPasswordResetRequest request) {
        User admin = getLoginAdmin(session);
        if (admin == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        userService.resetPasswordByAdmin(userId, request.getNewPassword());
        return ResponseEntity.ok("비밀번호가 성공적으로 재설정되었습니다.");
    }

    // 사용자 상세 정보 조회
    @GetMapping("/users/{userId}/details")
    public ResponseEntity<AdminUserDetailResponse> getUserDetailsByAdmin(HttpSession session,
                                                                         @PathVariable Long userId) {
        User admin = getLoginAdmin(session);
        if (admin == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        AdminUserDetailResponse details = userService.getAdminUserDetails(userId, admin.getId());
        return ResponseEntity.ok(details);
    }
}
