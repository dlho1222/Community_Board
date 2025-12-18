package com.finss.backend.post;

import com.finss.backend.comment.CommentRepository; // Import CommentRepository
import com.finss.backend.common.AccessDeniedException;
import com.finss.backend.file.FileRepository; // Import FileRepository
import com.finss.backend.user.User;
import com.finss.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort; // Import Sort
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PostServiceImpl implements PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository; // Inject CommentRepository
    private final FileRepository fileRepository; // Inject FileRepository

    @Override
    @Transactional
    public PostResponse createPost(PostCreateRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));

        Post newPost = Post.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .secret(request.isSecret())
                .user(user)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        Post savedPost = postRepository.save(newPost);
        return PostResponse.fromEntity(savedPost);
    }

    @Override
    public PostResponse getPostById(Long id, Long currentUserId, boolean isAdmin) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Post not found with id: " + id));

        if (post.isSecret()) {
            if (!isAdmin && (currentUserId == null || !currentUserId.equals(post.getUser().getId()))) {
                throw new AccessDeniedException("비밀글은 작성자 또는 관리자만 볼 수 있습니다.");
            }
        }

        return PostResponse.fromEntity(post);
    }

    @Override
    public List<PostResponse> getAllPosts(Long currentUserId, boolean isAdmin) {
        List<Post> posts = postRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")); // Sort by createdAt DESC

        return posts.stream()
                .map(post -> {
                    if (post.isSecret()) {
                        if (!isAdmin && (currentUserId == null || !currentUserId.equals(post.getUser().getId()))) {
                            return PostResponse.builder()
                                    .id(post.getId())
                                    .title("비밀글입니다.")
                                    .content("")
                                    .authorId(post.getUser().getId())
                                    .authorName(post.getUser().getUsername())
                                    .createdAt(post.getCreatedAt())
                                    .updatedAt(post.getUpdatedAt())
                                    .secret(true)
                                    .build();
                        }
                    }
                    return PostResponse.fromEntity(post);
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public PostResponse updatePost(Long id, PostUpdateRequest request, Long currentUserId, boolean isAdmin) {
        Post existingPost = postRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Post not found with id: " + id));

        if (!isAdmin && (currentUserId == null || !currentUserId.equals(existingPost.getUser().getId()))) {
            throw new AccessDeniedException("게시글을 수정할 권한이 없습니다.");
        }

        existingPost.setTitle(request.getTitle());
        existingPost.setContent(request.getContent());
        existingPost.setSecret(request.isSecret());

        Post updatedPost = postRepository.save(existingPost);
        return PostResponse.fromEntity(updatedPost);
    }

    @Override
    @Transactional
    public void deletePost(Long id, Long currentUserId, boolean isAdmin) {
        Post existingPost = postRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Post not found with id: " + id));

        if (!isAdmin && (currentUserId == null || !currentUserId.equals(existingPost.getUser().getId()))) {
            throw new AccessDeniedException("게시글을 삭제할 권한이 없습니다.");
        }

        // Delete associated files and comments first
        fileRepository.deleteAllByPost_Id(id);
        commentRepository.deleteAllByPost_Id(id);

        postRepository.delete(existingPost);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PostResponse> searchPostsByTitle(String keyword, Long currentUserId, boolean isAdmin) {
        List<Post> posts = postRepository.findByTitleContainingIgnoreCaseOrderByCreatedAtDesc(keyword);

        return posts.stream()
                .map(post -> {
                    if (post.isSecret()) {
                        if (!isAdmin && (currentUserId == null || !currentUserId.equals(post.getUser().getId()))) {
                            return PostResponse.builder()
                                    .id(post.getId())
                                    .title("비밀글입니다.")
                                    .content("")
                                    .authorId(post.getUser().getId())
                                    .authorName(post.getUser().getUsername())
                                    .createdAt(post.getCreatedAt())
                                    .updatedAt(post.getUpdatedAt())
                                    .secret(true)
                                    .build();
                        }
                    }
                    return PostResponse.fromEntity(post);
                })
                .collect(Collectors.toList());
    }
}
