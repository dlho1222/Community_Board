package com.finss.backend.post;

import com.finss.backend.comment.CommentRepository; // Import CommentRepository
import com.finss.backend.common.AccessDeniedException;
import com.finss.backend.file.FileRepository; // Import FileRepository
import com.finss.backend.user.User;
import com.finss.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort; // Import Sort
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PostServiceImpl implements PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final JdbcTemplate jdbcTemplate;
    private final CommentRepository commentRepository; // Inject CommentRepository
    private final FileRepository fileRepository; // Inject FileRepository

    @Override
    @Transactional
    public PostResponse createPost(PostCreateRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + request.getUserId()));

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

    private User mapRowToUser(ResultSet rs, int rowNum) throws SQLException {
        return User.builder()
                .id(rs.getLong("user_id"))
                .username(rs.getString("username"))
                .password(rs.getString("password"))
                .email(rs.getString("email"))
                .build();
    }

    private Post mapRowToPost(ResultSet rs, int rowNum) throws SQLException {
        User user = mapRowToUser(rs, rowNum);

        return Post.builder()
                .id(rs.getLong("id"))
                .title(rs.getString("title"))
                .content(rs.getString("content"))
                .secret(rs.getBoolean("is_secret"))
                .user(user)
                .createdAt(rs.getTimestamp("created_at").toLocalDateTime())
                .updatedAt(rs.getTimestamp("updated_at").toLocalDateTime())
                .build();
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
        String searchSql = "SELECT p.id, p.title, p.content, p.is_secret, p.created_at, p.updated_at, u.id AS user_id, u.username, u.password, u.email FROM posts p JOIN users u ON p.user_id = u.id WHERE p.title LIKE '%" + keyword + "%' ORDER BY p.created_at DESC";
        List<Post> posts = jdbcTemplate.query(searchSql, this::mapRowToPost);

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
