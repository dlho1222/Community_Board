package com.finss.backend.admin;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class AdminPasswordResetRequest {
    private String newPassword;
}
