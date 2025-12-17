package com.finss.backend.file;

import java.util.List;
import java.util.Optional;

public interface FileRepository {
    Long save(File file);
    Optional<File> findById(Long id);
    List<File> findByPostId(Long postId);
    int deleteById(Long id);
    int deleteByPostId(Long postId);
}
