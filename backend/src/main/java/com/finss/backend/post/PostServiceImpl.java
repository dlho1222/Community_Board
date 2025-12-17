package com.finss.backend.post;

import com.finss.backend.common.AccessDeniedException;
import com.finss.backend.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.jdbc.core.PreparedStatementCreator;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors; // Added missing import

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PostServiceImpl implements PostService {

    private final JdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public PostResponse createPost(PostCreateRequest request) {
        // 1. Find User by ID
        String findUserSql = "SELECT id, username, password, email FROM users WHERE id = ?";
        List<User> users = jdbcTemplate.query(findUserSql, this::mapRowToUser, request.getUserId());

        if (users.isEmpty()) {
            throw new IllegalArgumentException("User not found with id: " + request.getUserId());
        }
        User user = users.get(0);

        // 2. Insert Post and retrieve generated ID
        String insertPostSql = "INSERT INTO posts (title, content, is_secret, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())";
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            java.sql.PreparedStatement ps = connection.prepareStatement(insertPostSql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, request.getTitle());
            ps.setString(2, request.getContent());
            ps.setBoolean(3, request.isSecret());
            ps.setLong(4, user.getId());
            return ps;
        }, keyHolder);

        Long generatedPostId = keyHolder.getKey().longValue();

        // 3. Query the newly created post to get all accurate details including timestamps
        String findNewlyCreatedPostSql = "SELECT p.id, p.title, p.content, p.is_secret, p.created_at, p.updated_at, u.id AS user_id, u.username, u.password, u.email FROM posts p JOIN users u ON p.user_id = u.id WHERE p.id = ?";
        List<Post> newPosts = jdbcTemplate.query(findNewlyCreatedPostSql, this::mapRowToPost, generatedPostId);

        if (newPosts.isEmpty()) {
            throw new IllegalStateException("Newly created post not found. This should not happen.");
        }

        Post newPost = newPosts.get(0);
        return PostResponse.fromEntity(newPost);
    }

    @Override
    public PostResponse getPostById(Long id, Long currentUserId, boolean isAdmin) {
        String findPostSql = "SELECT p.id, p.title, p.content, p.is_secret, p.created_at, p.updated_at, u.id AS user_id, u.username, u.password, u.email FROM posts p JOIN users u ON p.user_id = u.id WHERE p.id = ?";
        List<Post> posts = jdbcTemplate.query(findPostSql, this::mapRowToPost, id);

        if (posts.isEmpty()) {
            throw new IllegalArgumentException("Post not found with id: " + id);
        }

        Post post = posts.get(0);

        // Authorization check for secret posts
        if (post.isSecret()) {
            if (!isAdmin && (currentUserId == null || !currentUserId.equals(post.getUser().getId()))) {
                throw new AccessDeniedException("비밀글은 작성자 또는 관리자만 볼 수 있습니다.");
            }
        }

        return PostResponse.fromEntity(post);
    }

    @Override
    public List<PostResponse> getAllPosts(Long currentUserId, boolean isAdmin) {
        String findAllPostsSql = "SELECT p.id, p.title, p.content, p.is_secret, p.created_at, p.updated_at, u.id AS user_id, u.username, u.password, u.email FROM posts p JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC";
        List<Post> posts = jdbcTemplate.query(findAllPostsSql, this::mapRowToPost);

        return posts.stream()
                .map(post -> {
                    // Apply authorization logic for each post
                    if (post.isSecret()) {
                        if (!isAdmin && (currentUserId == null || !currentUserId.equals(post.getUser().getId()))) {
                            // Hide content and show generic title for unauthorized secret posts
                            return PostResponse.builder()
                                    .id(post.getId())
                                    .title("비밀글입니다.")
                                    .content("") // Content is hidden
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
                .id(rs.getLong("id"))
                .username(rs.getString("username"))
                .password(rs.getString("password"))
                .email(rs.getString("email"))
                .build();
    }

    private Post mapRowToPost(ResultSet rs, int rowNum) throws SQLException {
        User user = User.builder()
                .id(rs.getLong("user_id")) // Use alias from JOIN
                .username(rs.getString("username"))
                .password(rs.getString("password"))
                .email(rs.getString("email"))
                .build();

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
        String findPostSql = "SELECT p.id, p.title, p.content, p.is_secret, p.created_at, p.updated_at, u.id AS user_id, u.username, u.password, u.email FROM posts p JOIN users u ON p.user_id = u.id WHERE p.id = ?";
        List<Post> posts = jdbcTemplate.query(findPostSql, this::mapRowToPost, id);

        if (posts.isEmpty()) {
            throw new IllegalArgumentException("Post not found with id: " + id);
        }

        Post existingPost = posts.get(0);

        // Authorization check for update
        if (!isAdmin && (currentUserId == null || !currentUserId.equals(existingPost.getUser().getId()))) {
            throw new AccessDeniedException("게시글을 수정할 권한이 없습니다.");
        }

        String updatePostSql = "UPDATE posts SET title = ?, content = ?, is_secret = ?, updated_at = NOW() WHERE id = ?";
        jdbcTemplate.update(updatePostSql, request.getTitle(), request.getContent(), request.isSecret(), id);

        return PostResponse.builder()
                .id(id)
                .title(request.getTitle())
                .content(request.getContent())
                .secret(request.isSecret())
                .authorId(existingPost.getUser().getId()) // Keep original author ID
                .authorName(existingPost.getUser().getUsername()) // Keep original author name
                .createdAt(existingPost.getCreatedAt())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Override
    @Transactional
    public void deletePost(Long id, Long currentUserId, boolean isAdmin) {
        String findPostSql = "SELECT p.id, p.title, p.content, p.is_secret, p.created_at, p.updated_at, u.id AS user_id, u.username, u.password, u.email FROM posts p JOIN users u ON p.user_id = u.id WHERE p.id = ?";
        List<Post> posts = jdbcTemplate.query(findPostSql, this::mapRowToPost, id);

        if (posts.isEmpty()) {
            throw new IllegalArgumentException("Post not found with id: " + id);
        }

        Post existingPost = posts.get(0);

        // Authorization check for delete
        if (!isAdmin && (currentUserId == null || !currentUserId.equals(existingPost.getUser().getId()))) {
            throw new AccessDeniedException("게시글을 삭제할 권한이 없습니다.");
        }

        String deletePostSql = "DELETE FROM posts WHERE id = ?";
        jdbcTemplate.update(deletePostSql, id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PostResponse> searchPostsByTitle(String keyword, Long currentUserId, boolean isAdmin) {
        String searchSql = "SELECT p.id, p.title, p.content, p.is_secret, p.created_at, p.updated_at, u.id AS user_id, u.username, u.password, u.email FROM posts p JOIN users u ON p.user_id = u.id WHERE p.title LIKE ? ORDER BY p.created_at DESC";
        String searchPattern = "%" + keyword + "%";
        List<Post> posts = jdbcTemplate.query(searchSql, this::mapRowToPost, searchPattern);

        return posts.stream()
                .map(post -> {
                    // Apply authorization logic for each post
                    if (post.isSecret()) {
                        if (!isAdmin && (currentUserId == null || !currentUserId.equals(post.getUser().getId()))) {
                            // Hide content and show generic title for unauthorized secret posts
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
