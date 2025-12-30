package com.finss.backend.file;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class FileResponse {
    private Long id;
    private String fileName;
    private String fileDownloadUri;
    private String fileType;
    private Long fileSize;
}
