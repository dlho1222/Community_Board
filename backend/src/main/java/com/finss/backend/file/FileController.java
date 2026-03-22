package com.finss.backend.file;

import com.finss.backend.common.AccessDeniedException;
import com.finss.backend.common.SessionConstants;
import com.finss.backend.user.User;
import com.finss.backend.user.UserRole;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/files")
public class FileController {

    private final FileService fileService;

    public FileController(FileService fileService) {
        this.fileService = fileService;
    }

    private User getLoginUser(HttpSession session) {
        return (User) session.getAttribute(SessionConstants.LOGIN_USER);
    }

    @PostMapping("/upload")
    public FileResponse uploadFile(@RequestParam("file") MultipartFile file, @RequestParam(value = "postId", required = false) Long postId, HttpSession session) {
        User loginUser = getLoginUser(session);
        if (loginUser == null) {
            throw new AccessDeniedException("파일 업로드를 위해서는 로그인이 필요합니다.");
        }

        File uploadedFile = fileService.uploadFile(file, postId, loginUser.getId()); // userId 전달

        String fileDownloadUri = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/api/files/")
                .path(uploadedFile.getId().toString())
                .toUriString();

        return FileResponse.builder()
                .id(uploadedFile.getId())
                .fileName(uploadedFile.getOriginalFileName())
                .fileDownloadUri(fileDownloadUri)
                .fileType(uploadedFile.getFileType())
                .fileSize(uploadedFile.getFileSize())
                .build();
    }

    @GetMapping("/{fileId}")
    public ResponseEntity<Resource> downloadFile(@PathVariable Long fileId, HttpServletRequest request, HttpSession session) {
        User loginUser = getLoginUser(session);
        Long currentUserId = loginUser != null ? loginUser.getId() : null;
        boolean isAdmin = loginUser != null && UserRole.ADMIN.name().equals(loginUser.getRole());

        Resource resource = fileService.downloadFile(fileId, currentUserId, isAdmin);

        String contentType = null;
        try {
            contentType = request.getServletContext().getMimeType(resource.getFile().getAbsolutePath());
        } catch (IOException ex) {
            contentType = "application/octet-stream";
        }

        if (contentType == null) {
            contentType = "application/octet-stream";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }

    @GetMapping("/post/{postId}")
    public List<FileResponse> getFilesByPostId(@PathVariable Long postId, HttpSession session) {
        User loginUser = getLoginUser(session);
        Long currentUserId = loginUser != null ? loginUser.getId() : null;
        boolean isAdmin = loginUser != null && UserRole.ADMIN.name().equals(loginUser.getRole());

        return fileService.getFilesByPostId(postId, currentUserId, isAdmin).stream()
                .map(file -> {
                    String fileDownloadUri = ServletUriComponentsBuilder.fromCurrentContextPath()
                            .path("/api/files/")
                            .path(file.getId().toString())
                            .toUriString();
                    return FileResponse.builder()
                            .id(file.getId())
                            .fileName(file.getOriginalFileName())
                            .fileDownloadUri(fileDownloadUri)
                            .fileType(file.getFileType())
                            .fileSize(file.getFileSize())
                            .build();
                })
                .collect(Collectors.toList());
    }

    @DeleteMapping("/{fileId}")
    public ResponseEntity<String> deleteFile(@PathVariable Long fileId, HttpSession session) {
        User loginUser = getLoginUser(session);
        if (loginUser == null) {
            throw new AccessDeniedException("파일 삭제 권한이 없습니다.");
        }
        boolean isAdmin = UserRole.ADMIN.name().equals(loginUser.getRole());

        fileService.deleteFile(fileId, loginUser.getId(), isAdmin);
        return ResponseEntity.ok("File deleted successfully.");
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<String> handleAccessDeniedException(AccessDeniedException e) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
    }
}
