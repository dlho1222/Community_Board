package com.finss.backend.post;

import com.finss.backend.common.AccessDeniedException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @PostMapping
    public ResponseEntity<PostResponse> createPost(@Valid @RequestBody PostCreateRequest request) {
        PostResponse createdPost = postService.createPost(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdPost);
    }

    @GetMapping
    public ResponseEntity<List<PostResponse>> getAllPosts(
            @RequestParam(required = false) Long currentUserId,
            @RequestParam(defaultValue = "false") boolean isAdmin) {
        List<PostResponse> posts = postService.getAllPosts(currentUserId, isAdmin);
        return ResponseEntity.ok(posts);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PostResponse> getPostById(
            @PathVariable Long id,
            @RequestParam(required = false) Long currentUserId,
            @RequestParam(defaultValue = "false") boolean isAdmin) {
        PostResponse post = postService.getPostById(id, currentUserId, isAdmin);
        return ResponseEntity.ok(post);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PostResponse> updatePost(
            @PathVariable Long id,
            @Valid @RequestBody PostUpdateRequest request,
            @RequestParam(required = false) Long currentUserId,
            @RequestParam(defaultValue = "false") boolean isAdmin) {
        PostResponse updatedPost = postService.updatePost(id, request, currentUserId, isAdmin);
        return ResponseEntity.ok(updatedPost);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(
            @PathVariable Long id,
            @RequestParam(required = false) Long currentUserId,
            @RequestParam(defaultValue = "false") boolean isAdmin) {
        postService.deletePost(id, currentUserId, isAdmin);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    public ResponseEntity<List<PostResponse>> searchPostsByTitle(
            @RequestParam String keyword,
            @RequestParam(required = false) Long currentUserId,
            @RequestParam(defaultValue = "false") boolean isAdmin) {
        List<PostResponse> posts = postService.searchPostsByTitle(keyword, currentUserId, isAdmin);
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
