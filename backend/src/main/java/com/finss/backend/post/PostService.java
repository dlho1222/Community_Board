package com.finss.backend.post;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface PostService {
    PostResponse createPost(PostCreateRequest request, Long userId);
    PostResponse getPostById(Long id, Long currentUserId, boolean isAdmin);
    Page<PostResponse> getAllPosts(Long currentUserId, boolean isAdmin, Pageable pageable);
    PostResponse updatePost(Long id, PostUpdateRequest request, Long currentUserId, boolean isAdmin);
    void deletePost(Long id, Long currentUserId, boolean isAdmin);
    Page<PostResponse> searchPostsByTitle(String keyword, Long currentUserId, boolean isAdmin, Pageable pageable);
    List<PostResponse> getPostsByUserId(Long userId, Long currentUserId, boolean isAdmin);
}
