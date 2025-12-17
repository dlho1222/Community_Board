package com.finss.backend.file;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;
import java.util.Optional;

@Repository
public class FileRepositoryImpl implements FileRepository {

    private final JdbcTemplate jdbcTemplate;

    public FileRepositoryImpl(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<File> fileRowMapper = (rs, rowNum) -> {
        File file = new File();
        file.setId(rs.getLong("id"));
        file.setOriginalFileName(rs.getString("original_file_name"));
        file.setStoredFileName(rs.getString("stored_file_name"));
        file.setFilePath(rs.getString("file_path"));
        file.setFileSize(rs.getLong("file_size"));
        file.setFileType(rs.getString("file_type"));
        file.setPostId(rs.getObject("post_id", Long.class)); // Can be null
        file.setUploadedAt(rs.getTimestamp("uploaded_at"));
        return file;
    };

    @Override
    public Long save(File file) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        String sql = "INSERT INTO files (original_file_name, stored_file_name, file_path, file_size, file_type, post_id, uploaded_at) VALUES (?, ?, ?, ?, ?, ?, ?)";
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, file.getOriginalFileName());
            ps.setString(2, file.getStoredFileName());
            ps.setString(3, file.getFilePath());
            ps.setLong(4, file.getFileSize());
            ps.setString(5, file.getFileType());
            if (file.getPostId() != null) {
                ps.setLong(6, file.getPostId());
            } else {
                ps.setNull(6, java.sql.Types.BIGINT);
            }
            ps.setTimestamp(7, file.getUploadedAt());
            return ps;
        }, keyHolder);

        return keyHolder.getKey() != null ? keyHolder.getKey().longValue() : null;
    }

    @Override
    public Optional<File> findById(Long id) {
        String sql = "SELECT * FROM files WHERE id = ?";
        List<File> files = jdbcTemplate.query(sql, fileRowMapper, id);
        return files.isEmpty() ? Optional.empty() : Optional.of(files.get(0));
    }

    @Override
    public List<File> findByPostId(Long postId) {
        String sql = "SELECT * FROM files WHERE post_id = ?";
        return jdbcTemplate.query(sql, fileRowMapper, postId);
    }

    @Override
    public int deleteById(Long id) {
        String sql = "DELETE FROM files WHERE id = ?";
        return jdbcTemplate.update(sql, id);
    }

    @Override
    public int deleteByPostId(Long postId) {
        String sql = "DELETE FROM files WHERE post_id = ?";
        return jdbcTemplate.update(sql, postId);
    }
}
