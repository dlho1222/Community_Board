package com.finss.backend.file;

import com.finss.backend.common.AccessDeniedException;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import jakarta.servlet.http.HttpServletRequest;

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

    @PostMapping("/upload")
    public FileResponse uploadFile(@RequestParam("file") MultipartFile file,
                                   @RequestParam(value = "postId", required = false) Long postId) {

        File uploadedFile = fileService.uploadFile(file, postId);

        String fileDownloadUri = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/api/files/")
                .path(uploadedFile.getId().toString())
                .toUriString();

        return new FileResponse(uploadedFile.getId(), uploadedFile.getOriginalFileName(), fileDownloadUri,
                uploadedFile.getFileType(), uploadedFile.getFileSize());
    }

    @GetMapping("/{fileId}")
    public ResponseEntity<Resource> downloadFile(@PathVariable Long fileId, HttpServletRequest request,
                                                 @RequestParam(required = false) Long currentUserId,
                                                 @RequestParam(defaultValue = "false") boolean isAdmin) {
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
    public List<FileResponse> getFilesByPostId(@PathVariable Long postId,
                                               @RequestParam(required = false) Long currentUserId,
                                               @RequestParam(defaultValue = "false") boolean isAdmin) {
        return fileService.getFilesByPostId(postId, currentUserId, isAdmin).stream()
                .map(file -> {
                    String fileDownloadUri = ServletUriComponentsBuilder.fromCurrentContextPath()
                            .path("/api/files/")
                            .path(file.getId().toString())
                            .toUriString();
                    return new FileResponse(file.getId(), file.getOriginalFileName(), fileDownloadUri,
                            file.getFileType(), file.getFileSize());
                })
                .collect(Collectors.toList());
    }

    @DeleteMapping("/{fileId}")
    public ResponseEntity<String> deleteFile(@PathVariable Long fileId,
                                             @RequestParam(required = false) Long currentUserId,
                                             @RequestParam(defaultValue = "false") boolean isAdmin) {
        fileService.deleteFile(fileId, currentUserId, isAdmin);
        return ResponseEntity.ok("File deleted successfully.");
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<String> handleAccessDeniedException(AccessDeniedException e) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
    }
}
