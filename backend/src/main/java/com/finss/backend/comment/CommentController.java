package com.finss.backend.comment;

import com.finss.backend.common.AccessDeniedException;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @PostMapping
    public ResponseEntity<CommentResponse> createComment(
            @Valid @RequestBody CommentCreateRequest request,
            HttpSession session,
            @RequestParam(defaultValue = "false") boolean isAdmin) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new AccessDeniedException("로그인이 필요합니다.");
        }
        CommentResponse createdComment = commentService.createComment(request, userId, isAdmin);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdComment);
    }

    @GetMapping("/post/{postId}")
    public ResponseEntity<List<CommentResponse>> getCommentsByPostId(
            @PathVariable Long postId,
            HttpSession session,
            @RequestParam(defaultValue = "false") boolean isAdmin) {
        Long currentUserId = (Long) session.getAttribute("userId");
        List<CommentResponse> comments = commentService.getCommentsByPostId(postId, currentUserId, isAdmin);
        return ResponseEntity.ok(comments);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CommentResponse> updateComment(@PathVariable Long id, @RequestBody String content) {
        // In a real application, you might want a DTO for update with validation
        CommentResponse updatedComment = commentService.updateComment(id, content);
        return ResponseEntity.ok(updatedComment);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Long id,
            HttpSession session,
            @RequestParam(defaultValue = "false") boolean isAdmin) {
        Long currentUserId = (Long) session.getAttribute("userId");
        if (currentUserId == null) {
            throw new AccessDeniedException("로그인이 필요합니다.");
        }
        commentService.deleteComment(id, currentUserId, isAdmin);
        return ResponseEntity.noContent().build();
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
