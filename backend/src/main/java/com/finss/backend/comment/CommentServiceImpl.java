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

        postService.getPostById(request.getPostId(), userId, isAdmin);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));

        Post post = postRepository.findById(request.getPostId())
                .orElseThrow(() -> new IllegalArgumentException("Post not found with id: " + request.getPostId()));

        Comment newComment = Comment.builder()
                .content(request.getContent())      //xss 취약점
                .user(user)
                .post(post)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        Comment savedComment = commentRepository.save(newComment);
        return CommentResponse.fromEntity(savedComment);
    }

    @Override
    public List<CommentResponse> getCommentsByPostId(Long postId, Long currentUserId, boolean isAdmin) {
        postService.getPostById(postId, currentUserId, isAdmin);

        List<Comment> comments = commentRepository.findByPost_Id(postId);

        return comments.stream()
                .map(CommentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public CommentResponse updateComment(Long id, String content) {
        Comment existingComment = commentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found with id: " + id));

        existingComment.setContent(content);        //stored xss 취약점 //불충분한인가 - 누가 이 수정을 요청했는지 확인하는 로직 없음

        Comment updatedComment = commentRepository.save(existingComment);
        return CommentResponse.fromEntity(updatedComment);
    }

    @Override
    @Transactional
    public void deleteComment(Long id, Long currentUserId, boolean isAdmin) {
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found with id: " + id));

        PostResponse postResponse = postService.getPostById(comment.getPost().getId(), currentUserId, isAdmin);

        if (!isAdmin && (currentUserId == null ||
                (!currentUserId.equals(comment.getUser().getId()) && !currentUserId.equals(postResponse.getAuthorId())))) {
            throw new AccessDeniedException("댓글을 삭제할 권한이 없습니다.");
        }

        commentRepository.delete(comment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CommentResponse> getCommentsByUserId(Long userId, Long currentUserId, boolean isAdmin) {
        List<Comment> comments = commentRepository.findByUserIdOrderByCreatedAtDesc(userId);

        return comments.stream()
                .map(comment -> {
                    try {
                        postService.getPostById(comment.getPost().getId(), currentUserId, isAdmin);
                        return CommentResponse.fromEntity(comment);
                    } catch (AccessDeniedException | IllegalArgumentException e) {
                        return null;
                    }
                })
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toList());
    }
}
