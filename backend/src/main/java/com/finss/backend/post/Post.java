package com.finss.backend.post;

import com.finss.backend.user.User;
import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
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
    private boolean secret = false; // Mapped to 'is_secret' in DB

    @Builder
    public Post(String title, String content, User user, boolean secret) {
        this.title = title;
        this.content = content;
        this.user = user;
        this.secret = secret;
    }

    public void update(String title, String content, boolean secret) {
        this.title = title;
        this.content = content;
        this.secret = secret;
    }
}
