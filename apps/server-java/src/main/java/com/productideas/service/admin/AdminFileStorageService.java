package com.productideas.service.admin;

import com.productideas.common.ApiException;
import com.productideas.config.AppProperties;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class AdminFileStorageService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp"
    );

    private final Path uploadRoot;
    private final long maxSizeBytes;

    public AdminFileStorageService(AppProperties appProperties) {
        AppProperties.Upload upload = appProperties.getUpload();
        this.uploadRoot = Paths.get(upload.getDir()).toAbsolutePath().normalize();
        this.maxSizeBytes = upload.getMaxSizeBytes();
    }

    public String saveImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ApiException("请选择要上传的图片", 400);
        }

        if (file.getSize() > maxSizeBytes) {
            throw new ApiException("图片大小不能超过 2MB", 400);
        }

        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        if (!ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new ApiException("仅支持 JPG、PNG、GIF、WebP 图片", 400);
        }

        String extension = resolveExtension(file.getOriginalFilename(), contentType);
        String filename = UUID.randomUUID() + extension;
        Path targetDir = uploadRoot.resolve("images");

        try {
            Files.createDirectories(targetDir);
            Path targetFile = targetDir.resolve(filename);
            file.transferTo(targetFile);
            return "/uploads/images/" + filename;
        } catch (IOException exception) {
            throw new ApiException("图片保存失败", 500);
        }
    }

    private static String resolveExtension(String originalFilename, String contentType) {
        if (originalFilename != null && originalFilename.contains(".")) {
            String ext = originalFilename.substring(originalFilename.lastIndexOf('.')).toLowerCase(Locale.ROOT);
            if (Set.of(".jpg", ".jpeg", ".png", ".gif", ".webp").contains(ext)) {
                return ext.equals(".jpeg") ? ".jpg" : ext;
            }
        }

        return switch (contentType) {
            case "image/png" -> ".png";
            case "image/gif" -> ".gif";
            case "image/webp" -> ".webp";
            default -> ".jpg";
        };
    }
}
