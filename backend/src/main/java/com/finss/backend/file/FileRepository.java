package com.finss.backend.file;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FileRepository extends JpaRepository<File, Long> {
    List<File> findByPost_Id(Long postId);
    void deleteAllByPost_Id(Long postId);
}
