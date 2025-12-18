package com.finss.backend.comment;

import com.finss.backend.common.AccessDeniedException;
import com.finss.backend.post.Post;
import com.finss.backend.post.PostResponse;
import com.finss.backend.post.PostRepository;
import com.finss.backend.post.PostService;
import com.finss.backend.user.User;
import com.finss.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepository;
    private final PostService postService;
    private final UserRepository userRepository;
    private final PostRepository postRepository;

    @Override
    @Transactional
    public CommentResponse createComment(CommentCreateRequest request, Long userId, boolean isAdmin) {
        // First, check if the user is authorized to comment on the post
        // This call will throw AccessDeniedException if the post is secret and user is not authorized
        postService.getPostById(request.getPostId(), userId, isAdmin);

        // Find User by ID using UserRepository
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));

        // Find Post by ID using PostRepository
        Post post = postRepository.findById(request.getPostId())
                .orElseThrow(() -> new IllegalArgumentException("Post not found with id: " + request.getPostId()));

        // Create Comment entity
        Comment newComment = Comment.builder()
                .content(request.getContent())
                .user(user)
                .post(post)
                .createdAt(LocalDateTime.now()) // Handled by @CreationTimestamp
                .updatedAt(LocalDateTime.now()) // Handled by @UpdateTimestamp
                .build();

        // Save Comment using CommentRepository
        Comment savedComment = commentRepository.save(newComment);
        return CommentResponse.fromEntity(savedComment);
    }

    @Override
    public List<CommentResponse> getCommentsByPostId(Long postId, Long currentUserId, boolean isAdmin) {
        // First, check if the user is authorized to view the post and its comments
        // This call will throw AccessDeniedException if the post is secret and user is not authorized
        postService.getPostById(postId, currentUserId, isAdmin);

        List<Comment> comments = commentRepository.findByPost_Id(postId); // Use JPA custom query method

        return comments.stream()
                .map(CommentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public CommentResponse updateComment(Long id, String content) {
        Comment existingComment = commentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found with id: " + id));

        existingComment.setContent(content);
        // updatedAt is handled by @UpdateTimestamp

        Comment updatedComment = commentRepository.save(existingComment);
        return CommentResponse.fromEntity(updatedComment);
    }

    @Override
    @Transactional
    public void deleteComment(Long id, Long currentUserId, boolean isAdmin) {
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found with id: " + id));

        // Authorize access to the parent post and check comment ownership
        PostResponse postResponse = postService.getPostById(comment.getPost().getId(), currentUserId, isAdmin); // This will throw AccessDeniedException if post is secret and user is not authorized

        // Check if current user is comment author, post author, or admin
        if (!isAdmin && (currentUserId == null ||
                (!currentUserId.equals(comment.getUser().getId()) && !currentUserId.equals(postResponse.getAuthorId())))) {
            throw new AccessDeniedException("댓글을 삭제할 권한이 없습니다.");
        }
        
        commentRepository.delete(comment);
    }
}
