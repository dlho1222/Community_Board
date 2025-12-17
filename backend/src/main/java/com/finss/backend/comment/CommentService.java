package com.finss.backend.comment;

import java.util.List;

public interface CommentService {
    CommentResponse createComment(CommentCreateRequest request, Long currentUserId, boolean isAdmin);
    List<CommentResponse> getCommentsByPostId(Long postId, Long currentUserId, boolean isAdmin);
    CommentResponse updateComment(Long id, String content); // Leaving as is for now
    void deleteComment(Long id, Long currentUserId, boolean isAdmin);
}
