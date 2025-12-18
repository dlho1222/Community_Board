package com.finss.backend.post;

import com.finss.backend.common.AccessDeniedException;
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

    @PostMapping
    public ResponseEntity<PostResponse> createPost(@Valid @RequestBody PostCreateRequest request, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new AccessDeniedException("로그인이 필요합니다.");
        }
        PostResponse createdPost = postService.createPost(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdPost);
    }

    @GetMapping
    public ResponseEntity<Page<PostResponse>> getAllPosts(
            HttpSession session,
            @RequestParam(defaultValue = "false") boolean isAdmin,
            Pageable pageable) { // Added Pageable parameter
        Long currentUserId = (Long) session.getAttribute("userId");
        Page<PostResponse> posts = postService.getAllPosts(currentUserId, isAdmin, pageable); // Pass pageable
        return ResponseEntity.ok(posts);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PostResponse> getPostById(
            @PathVariable Long id,
            HttpSession session,
            @RequestParam(defaultValue = "false") boolean isAdmin) {
        Long currentUserId = (Long) session.getAttribute("userId");
        PostResponse post = postService.getPostById(id, currentUserId, isAdmin);
        return ResponseEntity.ok(post);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PostResponse> updatePost(
            @PathVariable Long id,
            @Valid @RequestBody PostUpdateRequest request,
            HttpSession session,
            @RequestParam(defaultValue = "false") boolean isAdmin) {
        Long currentUserId = (Long) session.getAttribute("userId");
        if (currentUserId == null) {
            throw new AccessDeniedException("로그인이 필요합니다.");
        }
        PostResponse updatedPost = postService.updatePost(id, request, currentUserId, isAdmin);
        return ResponseEntity.ok(updatedPost);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(
            @PathVariable Long id,
            HttpSession session,
            @RequestParam(defaultValue = "false") boolean isAdmin) {
        Long currentUserId = (Long) session.getAttribute("userId");
        if (currentUserId == null) {
            throw new AccessDeniedException("로그인이 필요합니다.");
        }
        postService.deletePost(id, currentUserId, isAdmin);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    public ResponseEntity<Page<PostResponse>> searchPostsByTitle( // Changed return type
            @RequestParam String keyword,
            HttpSession session,
            @RequestParam(defaultValue = "false") boolean isAdmin,
            Pageable pageable) { // Added Pageable parameter
        Long currentUserId = (Long) session.getAttribute("userId");
        Page<PostResponse> posts = postService.searchPostsByTitle(keyword, currentUserId, isAdmin, pageable); // Pass pageable
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
