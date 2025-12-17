package com.finss.backend.post;

import java.util.List;

public interface PostService {
    PostResponse createPost(PostCreateRequest request);
    // Modified methods to include authorization context
    PostResponse getPostById(Long id, Long currentUserId, boolean isAdmin);
    List<PostResponse> getAllPosts(Long currentUserId, boolean isAdmin);
    PostResponse updatePost(Long id, PostUpdateRequest request, Long currentUserId, boolean isAdmin);
    void deletePost(Long id, Long currentUserId, boolean isAdmin);
    List<PostResponse> searchPostsByTitle(String keyword, Long currentUserId, boolean isAdmin);
}
