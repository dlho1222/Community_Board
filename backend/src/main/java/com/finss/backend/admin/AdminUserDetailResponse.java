package com.finss.backend.admin;

import com.finss.backend.comment.CommentResponse;
import com.finss.backend.post.PostResponse;
import com.finss.backend.user.UserResponse;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
public class AdminUserDetailResponse {
    private UserResponse user;
    private List<PostResponse> posts;
    private List<CommentResponse> comments;
}
