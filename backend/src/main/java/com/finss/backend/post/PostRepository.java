package com.finss.backend.post;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {
    Page<Post> findByTitleContainingIgnoreCase(String keyword, Pageable pageable);
    // findAll(Pageable pageable) is already implicitly available from JpaRepository
    List<Post> findByUserIdOrderByCreatedAtDesc(Long userId);
}
