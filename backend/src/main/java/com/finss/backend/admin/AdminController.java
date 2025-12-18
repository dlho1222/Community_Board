package com.finss.backend.admin;

import com.finss.backend.post.PostResponse;
import com.finss.backend.post.PostService;
import com.finss.backend.user.User;
import com.finss.backend.user.UserResponse;
import com.finss.backend.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserService userService;
    private final PostService postService;

    // 사용자 목록 조회
    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getAllUsers(@RequestHeader("X-USER-ID") Long adminId) {
        // 관리자 권한 확인
        User admin = userService.findById(adminId);
        if (!"ADMIN".equals(admin.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        List<User> users = userService.findAll();
        List<UserResponse> userResponses = users.stream()
                .map(UserResponse::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(userResponses);
    }

    // 게시글 전체 목록 조회
    @GetMapping("/posts")
    public ResponseEntity<Page<PostResponse>> getAllPostsForAdmin(@RequestHeader("X-USER-ID") Long adminId,
                                                                  Pageable pageable) { // Added Pageable parameter
        // 관리자 권한 확인
        User admin = userService.findById(adminId);
        if (!"ADMIN".equals(admin.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        // `getAllPosts` with isAdmin=true will return all posts including secret ones
        Page<PostResponse> posts = postService.getAllPosts(adminId, true, pageable); // Pass pageable
        return ResponseEntity.ok(posts);
    }

    // 게시글 삭제
    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<Void> deletePostByAdmin(@RequestHeader("X-USER-ID") Long adminId,
                                                  @PathVariable Long postId) {
        // 관리자 권한 확인
        User admin = userService.findById(adminId);
        if (!"ADMIN".equals(admin.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        // `deletePost` with isAdmin=true will bypass ownership check
        postService.deletePost(postId, adminId, true);
        return ResponseEntity.noContent().build();
    }

    // 사용자 정보 수정
    @PutMapping("/users/{userId}")
    public ResponseEntity<UserResponse> updateUserByAdmin(@RequestHeader("X-USER-ID") Long adminId,
                                                          @PathVariable Long userId,
                                                          @RequestBody AdminUserUpdateRequest request) {
        // 관리자 권한 확인
        User admin = userService.findById(adminId);
        if (!"ADMIN".equals(admin.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        User updatedUser = userService.adminUpdateUser(userId, request);
        return ResponseEntity.ok(UserResponse.fromEntity(updatedUser));
    }

    // 비밀번호 재설정
    @PutMapping("/users/{userId}/reset-password")
    public ResponseEntity<String> resetPasswordByAdmin(@RequestHeader("X-USER-ID") Long adminId,
                                                       @PathVariable Long userId,
                                                       @RequestBody AdminPasswordResetRequest request) {
        // 관리자 권한 확인
        User admin = userService.findById(adminId);
        if (!"ADMIN".equals(admin.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        userService.resetPasswordByAdmin(userId, request.getNewPassword());
        return ResponseEntity.ok("비밀번호가 성공적으로 재설정되었습니다.");
    }

    // 사용자 상세 정보 조회
    @GetMapping("/users/{userId}/details")
    public ResponseEntity<AdminUserDetailResponse> getUserDetailsByAdmin(@RequestHeader("X-USER-ID") Long adminId,
                                                                         @PathVariable Long userId) {
        // 관리자 권한 확인
        User admin = userService.findById(adminId);
        if (!"ADMIN".equals(admin.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        AdminUserDetailResponse details = userService.getAdminUserDetails(userId, adminId);
        return ResponseEntity.ok(details);
    }
}
