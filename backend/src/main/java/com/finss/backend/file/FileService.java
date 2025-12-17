package com.finss.backend.file;

import com.finss.backend.common.AccessDeniedException;
import com.finss.backend.post.PostService;
import com.finss.backend.post.PostResponse; // Import PostResponse
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.sql.Timestamp;
import java.util.List;

@Service
public class FileService {

    private final FileRepository fileRepository;
    private final FileStorageService fileStorageService;
    private final PostService postService; // Inject PostService

    public FileService(FileRepository fileRepository, FileStorageService fileStorageService, PostService postService) {
        this.fileRepository = fileRepository;
        this.fileStorageService = fileStorageService;
        this.postService = postService;
    }

    @Transactional
    public File uploadFile(MultipartFile file, Long postId) {
        String storedFileName = fileStorageService.storeFile(file);

        File fileEntity = new File();
        fileEntity.setOriginalFileName(file.getOriginalFilename());
        fileEntity.setStoredFileName(storedFileName);
        fileEntity.setFilePath(fileStorageService.getFileStorageLocation().resolve(storedFileName).toString());
        fileEntity.setFileSize(file.getSize());
        fileEntity.setFileType(file.getContentType());
        fileEntity.setPostId(postId);
        fileEntity.setUploadedAt(new Timestamp(System.currentTimeMillis()));

        Long fileId = fileRepository.save(fileEntity);
        fileEntity.setId(fileId);
        return fileEntity;
    }

    public Resource downloadFile(Long fileId, Long currentUserId, boolean isAdmin) {
        File fileEntity = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found with id " + fileId));

        // Authorize access to the parent post
        postService.getPostById(fileEntity.getPostId(), currentUserId, isAdmin); // This will throw AccessDeniedException if not authorized

        return fileStorageService.loadFileAsResource(fileEntity.getStoredFileName());
    }

    public List<File> getFilesByPostId(Long postId, Long currentUserId, boolean isAdmin) {
        // Authorize access to the parent post
        postService.getPostById(postId, currentUserId, isAdmin); // This will throw AccessDeniedException if not authorized

        return fileRepository.findByPostId(postId);
    }

    @Transactional
    public void deleteFile(Long fileId, Long currentUserId, boolean isAdmin) {
        File fileEntity = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found with id " + fileId));

        // Authorize access to the parent post
        PostResponse post = postService.getPostById(fileEntity.getPostId(), currentUserId, isAdmin); // This will throw AccessDeniedException if not authorized

        // Check if the current user is the author of the post or an admin to delete the file
        if (!isAdmin && (currentUserId == null || !currentUserId.equals(post.getAuthorId()))) {
            throw new AccessDeniedException("파일을 삭제할 권한이 없습니다.");
        }

        fileStorageService.deleteFile(fileEntity.getStoredFileName());
        fileRepository.deleteById(fileId);
    }

    @Transactional
    public void deleteFilesByPostId(Long postId, Long currentUserId, boolean isAdmin) {
        // Authorize access to the parent post
        PostResponse post = postService.getPostById(postId, currentUserId, isAdmin); // This will throw AccessDeniedException if not authorized

        // Check if the current user is the author of the post or an admin to delete files
        if (!isAdmin && (currentUserId == null || !currentUserId.equals(post.getAuthorId()))) {
            throw new AccessDeniedException("이 게시글의 파일을 삭제할 권한이 없습니다.");
        }

        List<File> filesToDelete = fileRepository.findByPostId(postId);
        for (File file : filesToDelete) {
            fileStorageService.deleteFile(file.getStoredFileName());
        }
        fileRepository.deleteByPostId(postId);
    }
}
