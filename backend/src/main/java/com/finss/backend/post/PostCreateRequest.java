package com.finss.backend.post;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PostCreateRequest {

    @NotBlank(message = "Title is required.")
    @Size(max = 100, message = "Title cannot be longer than 100 characters.")
    private String title;

    @NotBlank(message = "Content is required.")
    private String content;

    private boolean secret; // Renamed from isSecret
}
