package com.finss.backend.post;

import com.finss.backend.user.User;
import com.finss.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PostServiceImpl implements PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public PostResponse createPost(PostCreateRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + request.getUserId()));

        Post post = Post.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .secret(request.isSecret())
                .user(user)
                .build();

        user.addPost(post); // Use helper method to sync both sides of the relationship

        // With CascadeType.ALL, saving the user would also save the post.
        // But saving the post directly is also clear.
        Post savedPost = postRepository.save(post);
        return PostResponse.fromEntity(savedPost);
    }

    @Override
    public PostResponse getPostById(Long id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Post not found with id: " + id));

        // TODO: [Security] If post.isSecret() is true, check if the current user is the author or an admin.
        // If not, throw an authorization exception.

        return PostResponse.fromEntity(post);
    }

    @Override
    public List<PostResponse> getAllPosts() {
        return postRepository.findAll().stream()
                .map(post -> {
                    if (post.isSecret()) {
                        // For secret posts in a list, return a sanitized version
                        return PostResponse.builder()
                                .id(post.getId())
                                .title("비밀글입니다.")
                                .content("") // Content is hidden
                                .authorName(post.getUser().getUsername())
                                .createdAt(post.getCreatedAt())
                                .updatedAt(post.getUpdatedAt())
                                .secret(true)
                                .build();
                    } else {
                        // For public posts, return the full details
                        return PostResponse.fromEntity(post);
                    }
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public PostResponse updatePost(Long id, PostUpdateRequest request) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Post not found with id: " + id));

        // TODO: Add authorization check to ensure the user updating the post is the author

        // Use the dedicated update method on the entity
        post.update(request.getTitle(), request.getContent(), request.isSecret());

        Post updatedPost = postRepository.save(post); // Explicitly save the entity

        return PostResponse.fromEntity(updatedPost);
    }

    @Override
    @Transactional
    public void deletePost(Long id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Post not found with id: " + id));

        // TODO: Add authorization check

        postRepository.delete(post);
    }
}
