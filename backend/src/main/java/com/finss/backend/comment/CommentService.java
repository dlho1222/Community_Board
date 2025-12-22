package com.finss.backend.comment;

import java.util.List;

public interface CommentService {
    CommentResponse createComment(CommentCreateRequest request, Long userId, boolean isAdmin);
    List<CommentResponse> getCommentsByPostId(Long postId, Long currentUserId, boolean isAdmin);
    CommentResponse updateComment(Long id, String content);
    void deleteComment(Long id, Long currentUserId, boolean isAdmin);
    List<CommentResponse> getCommentsByUserId(Long userId, Long currentUserId, boolean isAdmin);
}
