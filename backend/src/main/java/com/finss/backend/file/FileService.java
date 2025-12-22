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
//File관련된 비지니스 로직 처리
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FileService {

    private final FileRepository fileRepository;
    //실제 파일 입출력 로직 전담
    private final FileStorageService fileStorageService;
    private final PostService postService;
    private final PostRepository postRepository;

    @Transactional
    public File uploadFile(MultipartFile file, Long postId) {
        //입출력 작업 필요시 FileStorageService에 위임
        String storedFileName = fileStorageService.storeFile(file);

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found with id: " + postId));

        File fileEntity = File.builder()
                .originalFileName(file.getOriginalFilename())
                .storedFileName(storedFileName)
                .filePath(fileStorageService.getFileStorageLocation().resolve(storedFileName).toString())
                .fileSize(file.getSize())
                .fileType(file.getContentType())
                .post(post)
                .uploadedAt(LocalDateTime.now())
                .build();

        return fileRepository.save(fileEntity);
    }

    public Resource downloadFile(Long fileId, Long currentUserId, boolean isAdmin) {
        File fileEntity = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found with id " + fileId));

        postService.getPostById(fileEntity.getPost().getId(), currentUserId, isAdmin);

        return fileStorageService.loadFileAsResource(fileEntity.getStoredFileName());
    }

    public List<File> getFilesByPostId(Long postId, Long currentUserId, boolean isAdmin) {

        postService.getPostById(postId, currentUserId, isAdmin);

        return fileRepository.findByPost_Id(postId);
    }

    @Transactional
    public void deleteFile(Long fileId, Long currentUserId, boolean isAdmin) {
        File fileEntity = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found with id " + fileId));

        PostResponse postResponse = postService.getPostById(fileEntity.getPost().getId(), currentUserId, isAdmin);

        if (!isAdmin && (currentUserId == null || !currentUserId.equals(postResponse.getAuthorId()))) {
            throw new AccessDeniedException("파일을 삭제할 권한이 없습니다.");
        }

        fileStorageService.deleteFile(fileEntity.getStoredFileName());
        fileRepository.delete(fileEntity);
    }

}
