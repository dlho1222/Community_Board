package com.finss.backend.file;

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

    public FileService(FileRepository fileRepository, FileStorageService fileStorageService) {
        this.fileRepository = fileRepository;
        this.fileStorageService = fileStorageService;
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

    public Resource downloadFile(Long fileId) {
        File fileEntity = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found with id " + fileId));
        return fileStorageService.loadFileAsResource(fileEntity.getStoredFileName());
    }

    public List<File> getFilesByPostId(Long postId) {
        return fileRepository.findByPostId(postId);
    }

    @Transactional
    public void deleteFile(Long fileId) {
        File fileEntity = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found with id " + fileId));

        fileStorageService.deleteFile(fileEntity.getStoredFileName());
        fileRepository.deleteById(fileId);
    }

    @Transactional
    public void deleteFilesByPostId(Long postId) {
        List<File> filesToDelete = fileRepository.findByPostId(postId);
        for (File file : filesToDelete) {
            fileStorageService.deleteFile(file.getStoredFileName());
        }
        fileRepository.deleteByPostId(postId);
    }
}
