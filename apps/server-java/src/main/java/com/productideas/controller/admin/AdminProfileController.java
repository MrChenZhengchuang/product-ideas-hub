package com.productideas.controller.admin;

import com.productideas.common.ApiResponse;
import com.productideas.domain.AdminIntegrationItem;
import com.productideas.domain.AdminPreferences;
import com.productideas.domain.AdminSessionDevice;
import com.productideas.domain.AdminUser;
import com.productideas.domain.ProfileView;
import com.productideas.security.AuthContext;
import com.productideas.security.AuthContextHelper;
import com.productideas.service.admin.AdminPreferencesService;
import com.productideas.service.admin.AdminProfileService;
import com.productideas.util.RequestUtils;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminProfileController {

    private final AdminPreferencesService adminPreferencesService;
    private final AdminProfileService adminProfileService;

    public AdminProfileController(
        AdminPreferencesService adminPreferencesService,
        AdminProfileService adminProfileService
    ) {
        this.adminPreferencesService = adminPreferencesService;
        this.adminProfileService = adminProfileService;
    }

    @GetMapping("/profile")
    public ApiResponse<ProfileView> getProfile(HttpServletRequest request) {
        AdminUser admin = AuthContextHelper.requireAdmin(request);
        return ApiResponse.ok(adminProfileService.getProfile(admin));
    }

    @PutMapping("/profile")
    public ApiResponse<Void> updateProfile(HttpServletRequest request, @RequestBody Map<String, Object> body) {
        AdminUser admin = AuthContextHelper.requireAdmin(request);
        adminProfileService.updateProfile(admin.getId(), body);
        return ApiResponse.okMessage("个人资料已更新");
    }

    @PostMapping("/profile/change-password")
    public ApiResponse<Void> changePassword(HttpServletRequest request, @RequestBody Map<String, Object> body) {
        AdminUser admin = AuthContextHelper.requireAdmin(request);
        adminProfileService.changePassword(admin.getId(), body);
        return ApiResponse.okMessage("密码已更新");
    }

    @GetMapping("/profile/preferences")
    public ApiResponse<AdminPreferences> getPreferences(HttpServletRequest request) {
        AdminUser admin = (AdminUser) request.getAttribute(AuthContext.ADMIN_USER);
        return ApiResponse.ok(adminPreferencesService.getPreferences(admin.getId()));
    }

    @PutMapping("/profile/preferences")
    public ApiResponse<AdminPreferences> updatePreferences(
        HttpServletRequest request,
        @RequestBody Map<String, Object> body
    ) {
        AdminUser admin = (AdminUser) request.getAttribute(AuthContext.ADMIN_USER);
        AdminPreferences preferences = adminPreferencesService.savePreferences(admin.getId(), body);
        return ApiResponse.ok(preferences, "界面偏好已更新");
    }

    @GetMapping("/profile/devices")
    public ApiResponse<List<AdminSessionDevice>> listDevices(HttpServletRequest request) {
        AdminUser admin = AuthContextHelper.requireAdmin(request);
        return ApiResponse.ok(adminProfileService.listDevices(admin.getId()));
    }

    @DeleteMapping("/profile/devices/{id}")
    public ApiResponse<Void> revokeDevice(HttpServletRequest request, @PathVariable String id) {
        AdminUser admin = AuthContextHelper.requireAdmin(request);
        long sessionId = RequestUtils.parsePositiveLong(id, "无效的设备会话");
        adminProfileService.revokeDevice(admin.getId(), sessionId);
        return ApiResponse.okMessage("设备已下线");
    }

    @GetMapping("/profile/integrations")
    public ApiResponse<List<AdminIntegrationItem>> listIntegrations(HttpServletRequest request) {
        AdminUser admin = AuthContextHelper.requireAdmin(request);
        return ApiResponse.ok(adminProfileService.listIntegrations(admin.getId()));
    }

    @PostMapping("/profile/integrations/{id}/bind")
    public ApiResponse<Void> bindIntegration(
        HttpServletRequest request,
        @PathVariable String id,
        @RequestBody Map<String, Object> body
    ) {
        AdminUser admin = AuthContextHelper.requireAdmin(request);
        long integrationId = RequestUtils.parsePositiveLong(id, "无效的应用");
        adminProfileService.bindIntegration(admin.getId(), integrationId, body);
        return ApiResponse.okMessage("应用已绑定");
    }

    @DeleteMapping("/profile/integrations/{id}/bind")
    public ApiResponse<Void> unbindIntegration(HttpServletRequest request, @PathVariable String id) {
        AdminUser admin = AuthContextHelper.requireAdmin(request);
        long integrationId = RequestUtils.parsePositiveLong(id, "无效的应用");
        adminProfileService.unbindIntegration(admin.getId(), integrationId);
        return ApiResponse.okMessage("应用已解绑");
    }
}
