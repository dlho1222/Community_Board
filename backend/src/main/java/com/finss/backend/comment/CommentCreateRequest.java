package com.finss.backend.comment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CommentCreateRequest {
    @NotBlank(message = "댓글 내용은 필수 입력 항목입니다.")
    private String content;

    @NotNull(message = "게시글 ID는 필수 입력 항목입니다.")
    private Long postId;
}
