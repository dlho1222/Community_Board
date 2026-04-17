package com.finss.backend.file;

import com.finss.backend.common.CustomFileNotFoundException;
import com.finss.backend.common.FileException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Slf4j
@Service
public class FileStorageService {

    private final Path fileStorageLocation;
    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList("jpg", "jpeg", "png", "gif", "pdf", "txt", "zip");

    public FileStorageService(@Value("${file.upload-dir:uploads}") String uploadDir) {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (IOException ex) {
            log.error("파일 저장 디렉토리 생성 실패: {}", this.fileStorageLocation, ex);
            throw new FileException("서버 내부 오류로 파일 저장소를 준비할 수 없습니다.");
        }
    }

    public String storeFile(MultipartFile file) {
        String originalFileName = Objects.requireNonNull(file.getOriginalFilename());

        String extension = getFileExtension(originalFileName);
        if (!ALLOWED_EXTENSIONS.contains(extension.toLowerCase())) {
            log.warn("허용되지 않는 확장자 시도: {}", extension);
            throw new IllegalArgumentException("지원하지 않는 파일 형식입니다.");
        }

        String fileName = UUID.randomUUID().toString() + "." + extension;

        try {
            Path targetLocation = this.fileStorageLocation.resolve(fileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            return fileName;
        } catch (IOException ex) {
            log.error("파일 물리 저장 중 오류 발생. 원본명: {}, 저장명: {}", originalFileName, fileName, ex);
            throw new FileException("파일을 서버에 저장하는 중 시스템 오류가 발생했습니다.");
        }
    }

    private String getFileExtension(String fileName) {
        int lastIndex = fileName.lastIndexOf(".");
        return (lastIndex == -1) ? "" : fileName.substring(lastIndex + 1);
    }

    public Resource loadFileAsResource(String fileName) {
        try {
            Path filePath = this.fileStorageLocation.resolve(fileName).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                log.warn("파일을 찾을 수 없거나 읽을 수 없음: {}", fileName);
                throw new CustomFileNotFoundException("요청하신 파일을 시스템에서 찾을 수 없습니다.");
            }
        } catch (MalformedURLException ex) {
            log.error("파일 경로 URL 생성 오류: {}", fileName, ex);
            throw new CustomFileNotFoundException("파일 경로 형식이 잘못되었습니다.");
        }
    }

    public boolean deleteFile(String fileName) {
        try {
            Path filePath = this.fileStorageLocation.resolve(fileName).normalize();
            return Files.deleteIfExists(filePath);
        } catch (IOException ex) {
            log.error("파일 삭제 실패: {}", fileName, ex);
            throw new FileException("파일 삭제 처리 중 서버 오류가 발생했습니다.");
        }
    }
}
