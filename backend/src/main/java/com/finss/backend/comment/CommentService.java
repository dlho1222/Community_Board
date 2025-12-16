package com.finss.backend.comment;

import java.util.List;

public interface CommentService {
    CommentResponse createComment(CommentCreateRequest request);
    List<CommentResponse> getCommentsByPostId(Long postId);
    CommentResponse updateComment(Long id, String content);
    void deleteComment(Long id);
}
