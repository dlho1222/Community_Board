package com.finss.backend.comment;

import com.finss.backend.common.AccessDeniedException;
import com.finss.backend.common.SessionConstants;
import com.finss.backend.user.User;
import com.finss.backend.user.UserRole;
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

    private User getLoginUser(HttpSession session) {
        return (User) session.getAttribute(SessionConstants.LOGIN_USER);
    }

    @PostMapping
    public ResponseEntity<CommentResponse> createComment(
            @Valid @RequestBody CommentCreateRequest request,
            HttpSession session) {
        User loginUser = getLoginUser(session);
        if (loginUser == null) {
            throw new AccessDeniedException("로그인이 필요합니다.");
        }
        boolean isAdmin = UserRole.ADMIN.name().equals(loginUser.getRole());
        CommentResponse createdComment = commentService.createComment(request, loginUser.getId(), isAdmin);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdComment);
    }

    @GetMapping("/post/{postId}")
    public ResponseEntity<List<CommentResponse>> getCommentsByPostId(
            @PathVariable Long postId,
            HttpSession session) {
        User loginUser = getLoginUser(session);
        Long currentUserId = loginUser != null ? loginUser.getId() : null;
        boolean isAdmin = loginUser != null && UserRole.ADMIN.name().equals(loginUser.getRole());
        
        List<CommentResponse> comments = commentService.getCommentsByPostId(postId, currentUserId, isAdmin);
        return ResponseEntity.ok(comments);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CommentResponse> updateComment(@PathVariable Long id, @RequestBody String content, HttpSession session) {
        User loginUser = getLoginUser(session);
        if (loginUser == null) {
            throw new AccessDeniedException("로그인이 필요합니다.");
        }
        
        // [보안 점검] 작성자 본인 확인 (서비스에서 처리하지만 컨트롤러에서도 1차 방어 가능)
        CommentResponse updatedComment = commentService.updateComment(id, content, loginUser.getId());
        return ResponseEntity.ok(updatedComment);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Long id,
            HttpSession session) {
        User loginUser = getLoginUser(session);
        if (loginUser == null) {
            throw new AccessDeniedException("로그인이 필요합니다.");
        }
        boolean isAdmin = UserRole.ADMIN.name().equals(loginUser.getRole());

        commentService.deleteComment(id, loginUser.getId(), isAdmin);
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
