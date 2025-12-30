package com.finss.backend.post;

import com.finss.backend.user.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Getter
/* JPA 스펙을 준수하기 위한 기본 생성자
 JPA 구현체(Hibernate)가 DB에서 데이터를 조회하여 Post 객체를 생성할 때 내부적으로 사용
 */
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@Table(name = "posts")
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String title;

    @Lob // Large Object for long text
    @Column(nullable = false)
    private String content;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @Column(name = "is_secret", nullable = false)
    private boolean secret = false;

    //직접 Setter를 사용하는 대신 이 비즈니스 메소드를 통해 상태 변경의 일관성을 관리
    public void update(String title, String content, boolean secret) {
        this.title = title;
        this.content = content;
        this.secret = secret;
    }

    @Builder
    public Post(Long id, String title, String content, User user, LocalDateTime createdAt, LocalDateTime updatedAt, boolean secret) {
        this.id = id;
        this.title = title;
        this.content = content;
        this.user = user;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.secret = secret;
    }
}
