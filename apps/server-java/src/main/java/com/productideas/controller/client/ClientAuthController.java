package com.productideas.controller.client;

import com.productideas.common.ApiResponse;
import com.productideas.domain.SiteUser;
import com.productideas.domain.UserProfile;
import com.productideas.security.AuthContextHelper;
import com.productideas.security.CaptchaService;
import com.productideas.service.client.ClientAuthService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/client")
public class ClientAuthController {

    private final CaptchaService captchaService;
    private final ClientAuthService clientAuthService;

    public ClientAuthController(CaptchaService captchaService, ClientAuthService clientAuthService) {
        this.captchaService = captchaService;
        this.clientAuthService = clientAuthService;
    }

    @GetMapping("/auth/captcha")
    public ApiResponse<CaptchaService.CaptchaPayload> captcha() {
        return ApiResponse.ok(captchaService.createCaptcha());
    }

    @PostMapping("/auth/register")
    public ApiResponse<Map<String, Object>> register(@RequestBody RegisterRequest request) {
        Map<String, Object> payload = clientAuthService.register(
            request.phone(),
            request.password(),
            request.nickname(),
            request.captchaId(),
            request.captchaCode()
        );
        return ApiResponse.ok(payload, "注册成功");
    }

    @PostMapping("/auth/login")
    public ApiResponse<Map<String, Object>> login(@RequestBody LoginRequest request) {
        Map<String, Object> payload = clientAuthService.login(
            request.phone(),
            request.password(),
            request.captchaId(),
            request.captchaCode()
        );
        return ApiResponse.ok(payload, "登录成功");
    }

    @GetMapping("/auth/current-user")
    public ApiResponse<SiteUser> currentUser(HttpServletRequest request) {
        SiteUser user = AuthContextHelper.requireSiteUser(request);
        return ApiResponse.ok(clientAuthService.toPublicUser(user));
    }

    @GetMapping("/users/me/profile")
    public ApiResponse<UserProfile> profile(HttpServletRequest request) {
        SiteUser user = AuthContextHelper.requireSiteUser(request);
        return ApiResponse.ok(clientAuthService.getProfile(user));
    }

    @PostMapping("/auth/change-password")
    public ApiResponse<Void> changePassword(HttpServletRequest request, @RequestBody ChangePasswordRequest body) {
        SiteUser user = AuthContextHelper.requireSiteUser(request);
        clientAuthService.changePassword(user, body.oldPassword(), body.newPassword());
        return ApiResponse.okMessage("密码修改成功");
    }

    public record RegisterRequest(
        String phone,
        String password,
        String nickname,
        String captchaId,
        String captchaCode
    ) {
    }

    public record LoginRequest(String phone, String password, String captchaId, String captchaCode) {
    }

    public record ChangePasswordRequest(String oldPassword, String newPassword) {
    }
}
