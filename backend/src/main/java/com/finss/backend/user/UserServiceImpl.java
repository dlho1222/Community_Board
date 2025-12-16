package com.finss.backend.user;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void register(UserRegisterRequest request) {
        // 사용자 이름 중복 확인
        String checkUsernameSql = "SELECT COUNT(*) FROM users WHERE username = ?";
        Integer usernameCount = jdbcTemplate.queryForObject(checkUsernameSql, Integer.class, request.getUsername());
        if (usernameCount != null && usernameCount > 0) {
            throw new IllegalArgumentException("이미 사용 중인 사용자 이름입니다.");
        }

        // 이메일 중복 확인
        String checkEmailSql = "SELECT COUNT(*) FROM users WHERE email = ?";
        Integer emailCount = jdbcTemplate.queryForObject(checkEmailSql, Integer.class, request.getEmail());
        if (emailCount != null && emailCount > 0) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }

        // 사용자 저장 (비밀번호는 암호화되지 않은 상태로 저장됨)
        String insertUserSql = "INSERT INTO users (username, password, email) VALUES (?, ?, ?)";
        jdbcTemplate.update(insertUserSql, request.getUsername(), request.getPassword(), request.getEmail());
    }

    @Override
    public User login(UserLoginRequest request) {
        String findUserSql = "SELECT id, username, password, email FROM users WHERE email = ?";
        List<User> users = jdbcTemplate.query(findUserSql, this::mapRowToUser, request.getEmail());

        if (users.isEmpty()) {
            throw new IllegalArgumentException("가입되지 않은 이메일입니다.");
        }

        User user = users.get(0);

        // TODO: 비밀번호 암호화 및 비교 로직 추가 필요
        if (!user.getPassword().equals(request.getPassword())) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }

        return user;
    }

    private User mapRowToUser(java.sql.ResultSet rs, int rowNum) throws java.sql.SQLException {
        return User.builder()
                .id(rs.getLong("id"))
                .username(rs.getString("username"))
                .password(rs.getString("password"))
                .email(rs.getString("email"))
                .build();
    }

    @Override
    public User update(Long id, UserUpdateRequest request) {
        String findUserSql = "SELECT id, username, password, email FROM users WHERE id = ?";
        List<User> users = jdbcTemplate.query(findUserSql, this::mapRowToUser, id);

        if (users.isEmpty()) {
            throw new IllegalArgumentException("사용자를 찾을 수 없습니다.");
        }

        User user = users.get(0);

        // 사용자 이름 변경 시 중복 확인
        if (!user.getUsername().equals(request.getUsername())) {
            String checkUsernameSql = "SELECT COUNT(*) FROM users WHERE username = ? AND id != ?";
            Integer usernameCount = jdbcTemplate.queryForObject(checkUsernameSql, Integer.class, request.getUsername(), id);
            if (usernameCount != null && usernameCount > 0) {
                throw new IllegalArgumentException("이미 사용 중인 사용자 이름입니다.");
            }
        }

        // 사용자 정보 업데이트
        String updateUserSql = "UPDATE users SET username = ?, password = ? WHERE id = ?";
        jdbcTemplate.update(updateUserSql, request.getUsername(), request.getPassword(), id);

        // 업데이트된 사용자 객체 반환 (DB에서 다시 조회하는 대신 요청 객체로 새로운 User 객체를 만들어 반환)
        // 실제로는 DB에서 다시 조회하는 것이 더 정확할 수 있으나, 여기서는 간소화
        return User.builder()
                .id(id)
                .username(request.getUsername())
                .password(request.getPassword()) // TODO: 비밀번호 암호화
                .email(user.getEmail())
                .build();
    }
}