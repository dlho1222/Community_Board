package com.finss.backend.file;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface FileService {

    File uploadFile(MultipartFile file, Long postId);

    Resource downloadFile(Long fileId, Long currentUserId, boolean isAdmin);

    List<File> getFilesByPostId(Long postId, Long currentUserId, boolean isAdmin);

    void deleteFile(Long fileId, Long currentUserId, boolean isAdmin);
}
