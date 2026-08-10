package com.productideas.controller.admin;

import com.productideas.common.ApiResponse;
import com.productideas.domain.AdminUser;
import com.productideas.security.AuthContext;
import com.productideas.security.CaptchaService;
import com.productideas.service.admin.AdminAuthService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminAuthController {

    private final CaptchaService captchaService;
    private final AdminAuthService adminAuthService;

    public AdminAuthController(CaptchaService captchaService, AdminAuthService adminAuthService) {
        this.captchaService = captchaService;
        this.adminAuthService = adminAuthService;
    }

    @GetMapping("/auth/captcha")
    public ApiResponse<CaptchaService.CaptchaPayload> captcha() {
        return ApiResponse.ok(captchaService.createCaptcha());
    }

    @PostMapping("/auth/login")
    public ApiResponse<Map<String, String>> login(@RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        String token = adminAuthService.login(
            request.account(),
            request.password(),
            request.captchaId(),
            request.captchaCode(),
            httpRequest
        );
        return ApiResponse.ok(Map.of("token", token), "登录成功");
    }

    @PostMapping("/auth/logout")
    public ApiResponse<Void> logout(HttpServletRequest request) {
        AdminUser admin = (AdminUser) request.getAttribute(AuthContext.ADMIN_USER);
        adminAuthService.logout(admin.getId(), admin.getSessionId());
        return ApiResponse.okMessage("已退出登录");
    }

    @GetMapping("/current-admin")
    public ApiResponse<AdminUser> currentAdmin(HttpServletRequest request) {
        AdminUser admin = (AdminUser) request.getAttribute(AuthContext.ADMIN_USER);
        return ApiResponse.ok(admin);
    }

    public record LoginRequest(String account, String password, String captchaId, String captchaCode) {
    }
}
