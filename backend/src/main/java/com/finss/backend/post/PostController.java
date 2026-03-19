package com.finss.backend.post;

import com.finss.backend.common.AccessDeniedException;
import com.finss.backend.user.User;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    private User getLoginUser(HttpSession session) {
        return (User) session.getAttribute("loginUser");
    }

    @PostMapping
    public ResponseEntity<PostResponse> createPost(@Valid @RequestBody PostCreateRequest request, HttpSession session) {
        User loginUser = getLoginUser(session);
        if (loginUser == null) {
            throw new AccessDeniedException("로그인이 필요합니다.");
        }
        PostResponse createdPost = postService.createPost(request, loginUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(createdPost);
    }

    @GetMapping
    public ResponseEntity<Page<PostResponse>> getAllPosts(
            HttpSession session,
            Pageable pageable) {
        User loginUser = getLoginUser(session);
        Long currentUserId = loginUser != null ? loginUser.getId() : null;
        boolean isAdmin = loginUser != null && "ADMIN".equals(loginUser.getRole());
        
        Page<PostResponse> posts = postService.getAllPosts(currentUserId, isAdmin, pageable);
        return ResponseEntity.ok(posts);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PostResponse> getPostById(
            @PathVariable Long id,
            HttpSession session) {
        User loginUser = getLoginUser(session);
        Long currentUserId = loginUser != null ? loginUser.getId() : null;
        boolean isAdmin = loginUser != null && "ADMIN".equals(loginUser.getRole());

        PostResponse post = postService.getPostById(id, currentUserId, isAdmin);
        return ResponseEntity.ok(post);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PostResponse> updatePost(
            @PathVariable Long id,
            @Valid @RequestBody PostUpdateRequest request,
            HttpSession session) {
        User loginUser = getLoginUser(session);
        if (loginUser == null) {
            throw new AccessDeniedException("로그인이 필요합니다.");
        }
        boolean isAdmin = "ADMIN".equals(loginUser.getRole());
        
        PostResponse updatedPost = postService.updatePost(id, request, loginUser.getId(), isAdmin);
        return ResponseEntity.ok(updatedPost);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(
            @PathVariable Long id,
            HttpSession session) {
        User loginUser = getLoginUser(session);
        if (loginUser == null) {
            throw new AccessDeniedException("로그인이 필요합니다.");
        }
        boolean isAdmin = "ADMIN".equals(loginUser.getRole());

        postService.deletePost(id, loginUser.getId(), isAdmin);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    public ResponseEntity<Page<PostResponse>> searchPostsByTitle(
            @RequestParam String keyword,
            HttpSession session,
            Pageable pageable) {
        User loginUser = getLoginUser(session);
        Long currentUserId = loginUser != null ? loginUser.getId() : null;
        boolean isAdmin = loginUser != null && "ADMIN".equals(loginUser.getRole());

        Page<PostResponse> posts = postService.searchPostsByTitle(keyword, currentUserId, isAdmin, pageable);
        return ResponseEntity.ok(posts);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> handleIllegalArgumentException(IllegalArgumentException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<String> handleAccessDeniedException(AccessDeniedException e) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
    }
}
