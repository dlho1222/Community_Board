package com.finss.backend.file;

public class FileResponse {
    private Long id;
    private String fileName;
    private String fileDownloadUri;
    private String fileType;
    private Long fileSize;

    public FileResponse(Long id, String fileName, String fileDownloadUri, String fileType, Long fileSize) {
        this.id = id;
        this.fileName = fileName;
        this.fileDownloadUri = fileDownloadUri;
        this.fileType = fileType;
        this.fileSize = fileSize;
    }

    // Getters
    public Long getId() {
        return id;
    }

    public String getFileName() {
        return fileName;
    }

    public String getFileDownloadUri() {
        return fileDownloadUri;
    }

    public String getFileType() {
        return fileType;
    }

    public Long getFileSize() {
        return fileSize;
    }
}
