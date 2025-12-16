package com.finss.backend.post;

import com.finss.backend.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

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

        // 2. Insert Post
        String insertPostSql = "INSERT INTO posts (title, content, is_secret, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())";
        jdbcTemplate.update(insertPostSql, request.getTitle(), request.getContent(), request.isSecret(), user.getId());

        return PostResponse.builder()
                .id(1L) // Dummy ID
                .title(request.getTitle())
                .content(request.getContent())
                .secret(request.isSecret())
                .authorName(user.getUsername())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Override
    public PostResponse getPostById(Long id) {
        String findPostSql = "SELECT p.id, p.title, p.content, p.is_secret, p.created_at, p.updated_at, u.id AS user_id, u.username, u.password, u.email FROM posts p JOIN users u ON p.user_id = u.id WHERE p.id = ?";
        List<Post> posts = jdbcTemplate.query(findPostSql, this::mapRowToPost, id);

        if (posts.isEmpty()) {
            throw new IllegalArgumentException("Post not found with id: " + id);
        }

        Post post = posts.get(0);

        return PostResponse.fromEntity(post);
    }

    @Override
    public List<PostResponse> getAllPosts() {
        String findAllPostsSql = "SELECT p.id, p.title, p.content, p.is_secret, p.created_at, p.updated_at, u.id AS user_id, u.username, u.password, u.email FROM posts p JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC";
        List<Post> posts = jdbcTemplate.query(findAllPostsSql, this::mapRowToPost);

        return posts.stream()
                .map(post -> {
                    if (post.isSecret()) {
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

                        return PostResponse.fromEntity(post);
                    }
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
    public PostResponse updatePost(Long id, PostUpdateRequest request) {
        String findPostSql = "SELECT p.id, p.title, p.content, p.is_secret, p.created_at, p.updated_at, u.id AS user_id, u.username, u.password, u.email FROM posts p JOIN users u ON p.user_id = u.id WHERE p.id = ?";
        List<Post> posts = jdbcTemplate.query(findPostSql, this::mapRowToPost, id);

        if (posts.isEmpty()) {
            throw new IllegalArgumentException("Post not found with id: " + id);
        }

        Post existingPost = posts.get(0);

        String updatePostSql = "UPDATE posts SET title = ?, content = ?, is_secret = ?, updated_at = NOW() WHERE id = ?";
        jdbcTemplate.update(updatePostSql, request.getTitle(), request.getContent(), request.isSecret(), id);

        return PostResponse.builder()
                .id(id)
                .title(request.getTitle())
                .content(request.getContent())
                .secret(request.isSecret())
                .authorName(existingPost.getUser().getUsername()) // Keep original author name
                .createdAt(existingPost.getCreatedAt())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Override
    @Transactional
    public void deletePost(Long id) {
        String findPostSql = "SELECT p.id, p.title, p.content, p.is_secret, p.created_at, p.updated_at, u.id AS user_id, u.username, u.password, u.email FROM posts p JOIN users u ON p.user_id = u.id WHERE p.id = ?";
        List<Post> posts = jdbcTemplate.query(findPostSql, this::mapRowToPost, id);

        if (posts.isEmpty()) {
            throw new IllegalArgumentException("Post not found with id: " + id);
        }

        String deletePostSql = "DELETE FROM posts WHERE id = ?";
        jdbcTemplate.update(deletePostSql, id);
    }
}