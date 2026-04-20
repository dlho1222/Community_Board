package com.finss.backend.file;

import com.finss.backend.common.AccessDeniedException;
import com.finss.backend.post.Post; // Import Post entity
import com.finss.backend.post.PostRepository; // Import PostRepository
import com.finss.backend.post.PostService;
import com.finss.backend.post.PostResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime; // Use LocalDateTime
import java.util.List;
//File관련된 비지니스 로직 처리
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FileServiceImpl implements FileService {

    private final FileRepository fileRepository;
    //실제 파일 입출력 로직 전담
    private final FileStorageService fileStorageService;
    private final PostService postService;
    private final PostRepository postRepository;

    @Override
    @Transactional
    public File uploadFile(MultipartFile file, Long postId, Long userId) {
        // 입출력 작업 필요시 FileStorageService에 위임
        String storedFileName = fileStorageService.storeFile(file);

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found with id: " + postId));

        File fileEntity = File.builder()
                .originalFileName(file.getOriginalFilename())
                .storedFileName(storedFileName)
                .fileSize(file.getSize())
                .fileType(file.getContentType())
                .post(post)
                .uploadedAt(LocalDateTime.now())
                .build();

        return fileRepository.save(fileEntity);
    }

    @Override
    public Resource downloadFile(Long fileId, Long currentUserId, boolean isAdmin) {
        File fileEntity = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found with id " + fileId));

        postService.getPostById(fileEntity.getPost().getId(), currentUserId, isAdmin);

        return fileStorageService.loadFileAsResource(fileEntity.getStoredFileName());
    }

    @Override
    public List<File> getFilesByPostId(Long postId, Long currentUserId, boolean isAdmin) {

        postService.getPostById(postId, currentUserId, isAdmin);

        return fileRepository.findByPost_Id(postId);
    }

    @Override
    @Transactional
    public void deleteFile(Long fileId, Long currentUserId, boolean isAdmin) {
        File fileEntity = fileRepository.findById(fileId)
                .orElseThrow(() -> new IllegalArgumentException("파일을 찾을 수 없습니다. ID: " + fileId));

        //게시글 조회 권한 확인 (비밀글 등)
        PostResponse postResponse = postService.getPostById(fileEntity.getPost().getId(), currentUserId, isAdmin);

        //삭제 권한 확인: 관리자이거나 파일이 속한 게시글의 작성자여야 함
        if (!isAdmin && (currentUserId == null || !currentUserId.equals(postResponse.getAuthorId()))) {
            throw new AccessDeniedException("파일을 삭제할 권한이 없습니다.");
        }

        //서버 디스크에서 실제 파일 삭제
        boolean deleted = fileStorageService.deleteFile(fileEntity.getStoredFileName());
        if (!deleted) {
            log.warn("파일 삭제 실패: 디스크에 파일이 없습니다. 파일명: {}", fileEntity.getOriginalFileName());
        }

        //DB에서 파일 정보 삭제
        fileRepository.delete(fileEntity);
    }

}
