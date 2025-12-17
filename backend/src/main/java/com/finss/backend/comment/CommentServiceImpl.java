package com.finss.backend.comment;

import com.finss.backend.common.AccessDeniedException;
import com.finss.backend.post.Post; // Keep Post import for mapRowToComment if needed, or remove if fully replaced by PostService
import com.finss.backend.post.PostResponse;
import com.finss.backend.post.PostService; // Import PostService
import com.finss.backend.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommentServiceImpl implements CommentService {

    private final JdbcTemplate jdbcTemplate;
    private final PostService postService; // Inject PostService

    @Override
    @Transactional
    public CommentResponse createComment(CommentCreateRequest request, Long currentUserId, boolean isAdmin) {
        // First, check if the user is authorized to comment on the post
        // This call will throw AccessDeniedException if the post is secret and user is not authorized
        postService.getPostById(request.getPostId(), currentUserId, isAdmin);

        // 1. Find User by ID
        String findUserSql = "SELECT id, username, password, email FROM users WHERE id = ?";
        List<User> users = jdbcTemplate.query(findUserSql, this::mapRowToUser, request.getUserId());

        if (users.isEmpty()) {
            throw new IllegalArgumentException("User not found with id: " + request.getUserId());
        }
        User user = users.get(0);

        // 2. Insert Comment
        String insertCommentSql = "INSERT INTO comments (content, user_id, post_id, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())";
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            java.sql.PreparedStatement ps = connection.prepareStatement(insertCommentSql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, request.getContent());
            ps.setLong(2, user.getId());
            ps.setLong(3, request.getPostId()); // Use postId from request
            return ps;
        }, keyHolder);

        Long generatedCommentId = keyHolder.getKey().longValue();

        // 3. Query the newly created comment to get all accurate details
        String findNewlyCreatedCommentSql = "SELECT c.id, c.content, c.created_at, c.updated_at, " +
                                          "u.id AS user_id, u.username, u.password, u.email, " +
                                          "p.id AS post_id, p.title, p.content AS post_content, p.is_secret AS post_is_secret, p.created_at AS post_created_at, p.updated_at AS post_updated_at " +
                                          "FROM comments c JOIN users u ON c.user_id = u.id JOIN posts p ON c.post_id = p.id WHERE c.id = ?";
        List<Comment> newComments = jdbcTemplate.query(findNewlyCreatedCommentSql, this::mapRowToComment, generatedCommentId);

        if (newComments.isEmpty()) {
            throw new IllegalStateException("Newly created comment not found. This should not happen.");
        }

        Comment newComment = newComments.get(0);
        return CommentResponse.fromEntity(newComment);
    }

    @Override
    public List<CommentResponse> getCommentsByPostId(Long postId, Long currentUserId, boolean isAdmin) {
        // First, check if the user is authorized to view the post and its comments
        // This call will throw AccessDeniedException if the post is secret and user is not authorized
        postService.getPostById(postId, currentUserId, isAdmin);

        String findCommentsSql = "SELECT c.id, c.content, c.created_at, c.updated_at, " +
                                 "u.id AS user_id, u.username, u.password, u.email, " +
                                 "p.id AS post_id, p.title, p.content AS post_content, p.is_secret AS post_is_secret, p.created_at AS post_created_at, p.updated_at AS post_updated_at " +
                                 "FROM comments c JOIN users u ON c.user_id = u.id JOIN posts p ON c.post_id = p.id WHERE c.post_id = ? ORDER BY c.created_at ASC";
        List<Comment> comments = jdbcTemplate.query(findCommentsSql, this::mapRowToComment, postId);

        return comments.stream()
                .map(CommentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public CommentResponse updateComment(Long id, String content) {
        String findCommentSql = "SELECT c.id, c.content, c.created_at, c.updated_at, " +
                                "u.id AS user_id, u.username, u.password, u.email, " +
                                "p.id AS post_id, p.title, p.content AS post_content, p.is_secret AS post_is_secret, p.created_at AS post_created_at, p.updated_at AS post_updated_at " +
                                "FROM comments c JOIN users u ON c.user_id = u.id JOIN posts p ON c.post_id = p.id WHERE c.id = ?";
        List<Comment> comments = jdbcTemplate.query(findCommentSql, this::mapRowToComment, id);

        if (comments.isEmpty()) {
            throw new IllegalArgumentException("Comment not found with id: " + id);
        }

        String updateCommentSql = "UPDATE comments SET content = ?, updated_at = NOW() WHERE id = ?";
        jdbcTemplate.update(updateCommentSql, content, id);

        // Re-query updated comment to return accurate data
        Comment updatedCommentEntity = jdbcTemplate.queryForObject(findCommentSql, this::mapRowToComment, id);
        return CommentResponse.fromEntity(updatedCommentEntity);
    }

    @Override
    @Transactional
    public void deleteComment(Long id, Long currentUserId, boolean isAdmin) {
        String findCommentSql = "SELECT c.id, c.content, c.created_at, c.updated_at, " +
                                "u.id AS user_id, u.username, u.password, u.email, " +
                                "p.id AS post_id, p.title, p.content AS post_content, p.is_secret AS post_is_secret, p.created_at AS post_created_at, p.updated_at AS post_updated_at " +
                                "FROM comments c JOIN users u ON c.user_id = u.id JOIN posts p ON c.post_id = p.id WHERE c.id = ?";
        List<Comment> comments = jdbcTemplate.query(findCommentSql, this::mapRowToComment, id);

        if (comments.isEmpty()) {
            throw new IllegalArgumentException("Comment not found with id: " + id);
        }
        Comment comment = comments.get(0);

        // Authorize access to the parent post and check comment ownership
        PostResponse post = postService.getPostById(comment.getPost().getId(), currentUserId, isAdmin); // This will throw AccessDeniedException if post is secret and user is not authorized

        // Check if current user is comment author, post author, or admin
        if (!isAdmin && (currentUserId == null ||
                (!currentUserId.equals(comment.getUser().getId()) && !currentUserId.equals(post.getAuthorId())))) {
            throw new AccessDeniedException("댓글을 삭제할 권한이 없습니다.");
        }
        
        String deleteCommentSql = "DELETE FROM comments WHERE id = ?";
        jdbcTemplate.update(deleteCommentSql, id);
    }

    private User mapRowToUser(ResultSet rs, int rowNum) throws SQLException {
        // This is for mapping User directly, not from a JOIN with aliases like in PostServiceImpl
                    return User.builder()
                            .id(rs.getLong("id"))                .username(rs.getString("username"))
                .password(rs.getString("password"))
                .email(rs.getString("email"))
                .build();
    }

    // This mapRowToPost is simplified as PostService now handles full Post fetching
    private Post mapRowToPost(ResultSet rs, int rowNum) throws SQLException {
        return Post.builder()
                .id(rs.getLong("post_id"))
                .title(rs.getString("title"))
                .content(rs.getString("post_content"))
                .secret(rs.getBoolean("post_is_secret"))
                .createdAt(rs.getTimestamp("post_created_at").toLocalDateTime())
                .updatedAt(rs.getTimestamp("post_updated_at").toLocalDateTime())
                .build();
    }

    private Comment mapRowToComment(ResultSet rs, int rowNum) throws SQLException {
        // Map User details from the JOIN query (aliases starting with 'user_')
        User user = User.builder()
                .id(rs.getLong("user_id"))
                .username(rs.getString("username"))
                .password(rs.getString("password"))
                .email(rs.getString("email"))
                .build();

        // Map Post details from the JOIN query (aliases starting with 'post_')
        Post post = Post.builder()
                .id(rs.getLong("post_id"))
                .title(rs.getString("title"))
                .content(rs.getString("post_content"))
                .secret(rs.getBoolean("post_is_secret"))
                .user(null) // We don't need the post's author here for comment mapping
                .createdAt(rs.getTimestamp("post_created_at").toLocalDateTime())
                .updatedAt(rs.getTimestamp("post_updated_at").toLocalDateTime())
                .build();

        return Comment.builder()
                .id(rs.getLong("id"))
                .content(rs.getString("content"))
                .user(user)
                .post(post)
                .createdAt(rs.getTimestamp("created_at").toLocalDateTime())
                .updatedAt(rs.getTimestamp("updated_at").toLocalDateTime())
                .build();
    }
}
