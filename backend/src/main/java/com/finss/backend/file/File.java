package com.finss.backend.file;

import java.sql.Timestamp;

public class File {
    private Long id;
    private String originalFileName;
    private String storedFileName;
    private String filePath;
    private Long fileSize;
    private String fileType;
    private Long postId; // Optional, to link to a post
    private Timestamp uploadedAt;

    public File() {
    }

    public File(Long id, String originalFileName, String storedFileName, String filePath, Long fileSize, String fileType, Long postId, Timestamp uploadedAt) {
        this.id = id;
        this.originalFileName = originalFileName;
        this.storedFileName = storedFileName;
        this.filePath = filePath;
        this.fileSize = fileSize;
        this.fileType = fileType;
        this.postId = postId;
        this.uploadedAt = uploadedAt;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getOriginalFileName() {
        return originalFileName;
    }

    public void setOriginalFileName(String originalFileName) {
        this.originalFileName = originalFileName;
    }

    public String getStoredFileName() {
        return storedFileName;
    }

    public void setStoredFileName(String storedFileName) {
        this.storedFileName = storedFileName;
    }

    public String getFilePath() {
        return filePath;
    }

    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public String getFileType() {
        return fileType;
    }

    public void setFileType(String fileType) {
        this.fileType = fileType;
    }

    public Long getPostId() {
        return postId;
    }

    public void setPostId(Long postId) {
        this.postId = postId;
    }

    public Timestamp getUploadedAt() {
        return uploadedAt;
    }

    public void setUploadedAt(Timestamp uploadedAt) {
        this.uploadedAt = uploadedAt;
    }

    @Override
    public String toString() {
        return "File{" +
                "id=" + id +
                ", originalFileName='" + originalFileName + "'" +
                ", storedFileName='" + storedFileName + "'" +
                ", filePath='" + filePath + "'" +
                ", fileSize=" + fileSize +
                ", fileType='" + fileType + "'" +
                ", postId=" + postId +
                ", uploadedAt=" + uploadedAt +
                '}';
    }
}
