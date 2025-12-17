package com.finss.backend.file;

import com.finss.backend.common.AccessDeniedException;
import com.finss.backend.post.Post; // Import Post entity
import com.finss.backend.post.PostRepository; // Import PostRepository
import com.finss.backend.post.PostService;
import com.finss.backend.post.PostResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime; // Use LocalDateTime
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FileService {

    private final FileRepository fileRepository;
    private final FileStorageService fileStorageService;
    private final PostService postService; // Keep PostService for authorization logic
    private final PostRepository postRepository; // Inject PostRepository

    @Transactional
    public File uploadFile(MultipartFile file, Long postId) {
        String storedFileName = fileStorageService.storeFile(file);

        // Retrieve Post entity for the relationship
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found with id: " + postId));

        File fileEntity = File.builder()
                .originalFileName(file.getOriginalFilename())
                .storedFileName(storedFileName)
                .filePath(fileStorageService.getFileStorageLocation().resolve(storedFileName).toString())
                .fileSize(file.getSize())
                .fileType(file.getContentType())
                .post(post) // Set Post entity
                .uploadedAt(LocalDateTime.now()) // Handled by @CreationTimestamp
                .build();

        return fileRepository.save(fileEntity); // Save and return the managed entity
    }

    public Resource downloadFile(Long fileId, Long currentUserId, boolean isAdmin) {
        File fileEntity = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found with id " + fileId));

        // Authorize access to the parent post
        // getPostById will throw AccessDeniedException if not authorized
        postService.getPostById(fileEntity.getPost().getId(), currentUserId, isAdmin);

        return fileStorageService.loadFileAsResource(fileEntity.getStoredFileName());
    }

    public List<File> getFilesByPostId(Long postId, Long currentUserId, boolean isAdmin) {
        // Authorize access to the parent post
        // getPostById will throw AccessDeniedException if not authorized
        postService.getPostById(postId, currentUserId, isAdmin);

        // Use JPA repository method to find files by post ID
        return fileRepository.findByPost_Id(postId);
    }

    @Transactional
    public void deleteFile(Long fileId, Long currentUserId, boolean isAdmin) {
        File fileEntity = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found with id " + fileId));

        // Authorize access to the parent post
        PostResponse postResponse = postService.getPostById(fileEntity.getPost().getId(), currentUserId, isAdmin);

        // Check if the current user is the author of the post or an admin to delete the file
        if (!isAdmin && (currentUserId == null || !currentUserId.equals(postResponse.getAuthorId()))) {
            throw new AccessDeniedException("파일을 삭제할 권한이 없습니다.");
        }

        fileStorageService.deleteFile(fileEntity.getStoredFileName());
        fileRepository.delete(fileEntity); // Delete entity via JPA repository
    }

    @Transactional
    public void deleteFilesByPostId(Long postId, Long currentUserId, boolean isAdmin) {
        // Authorize access to the parent post
        PostResponse postResponse = postService.getPostById(postId, currentUserId, isAdmin);

        // Check if the current user is the author of the post or an admin to delete files
        if (!isAdmin && (currentUserId == null || !currentUserId.equals(postResponse.getAuthorId()))) {
            throw new AccessDeniedException("이 게시글의 파일을 삭제할 권한이 없습니다.");
        }

        List<File> filesToDelete = fileRepository.findByPost_Id(postId);
        for (File file : filesToDelete) {
            fileStorageService.deleteFile(file.getStoredFileName());
        }
        fileRepository.deleteAll(filesToDelete); // Delete entities via JPA repository
    }
}
