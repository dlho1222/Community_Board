package com.finss.backend.post;

import java.util.List;

public interface PostService {
    PostResponse createPost(PostCreateRequest request);
    PostResponse getPostById(Long id);
    List<PostResponse> getAllPosts();
    PostResponse updatePost(Long id, PostUpdateRequest request);
    void deletePost(Long id);
}
