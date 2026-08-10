package com.productideas.controller.admin;

import com.productideas.common.ApiResponse;
import com.productideas.security.AuthContextHelper;
import com.productideas.service.admin.AdminFileStorageService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin")
public class AdminUploadController {

    private final AdminFileStorageService adminFileStorageService;

    public AdminUploadController(AdminFileStorageService adminFileStorageService) {
        this.adminFileStorageService = adminFileStorageService;
    }

    @PostMapping("/upload/image")
    public ApiResponse<Map<String, String>> uploadImage(
        HttpServletRequest request,
        @RequestParam("file") MultipartFile file
    ) {
        AuthContextHelper.requireAdmin(request);
        String url = adminFileStorageService.saveImage(file);
        return ApiResponse.ok(Map.of("url", url), "图片上传成功");
    }
}
