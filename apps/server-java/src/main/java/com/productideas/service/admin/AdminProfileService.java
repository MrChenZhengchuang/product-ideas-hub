package com.productideas.service.admin;

import com.productideas.common.ApiException;
import com.productideas.domain.AdminIntegrationItem;
import com.productideas.domain.AdminSessionDevice;
import com.productideas.domain.AdminUser;
import com.productideas.domain.ProfileView;
import com.productideas.mapper.AdminIntegrationMapper;
import com.productideas.mapper.AdminSessionMapper;
import com.productideas.mapper.AdminUserMapper;
import com.productideas.security.PasswordService;
import com.productideas.util.RequestUtils;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class AdminProfileService {

    private final AdminUserMapper adminUserMapper;
    private final AdminSessionMapper adminSessionMapper;
    private final AdminIntegrationMapper adminIntegrationMapper;
    private final PasswordService passwordService;

    public AdminProfileService(
        AdminUserMapper adminUserMapper,
        AdminSessionMapper adminSessionMapper,
        AdminIntegrationMapper adminIntegrationMapper,
        PasswordService passwordService
    ) {
        this.adminUserMapper = adminUserMapper;
        this.adminSessionMapper = adminSessionMapper;
        this.adminIntegrationMapper = adminIntegrationMapper;
        this.passwordService = passwordService;
    }

    public ProfileView getProfile(AdminUser admin) {
        ProfileView profile = adminUserMapper.findProfileById(admin.getId());
        if (profile == null) {
            throw new ApiException("管理员不存在", 404);
        }
        profile.setRole(admin.getRole());
        profile.setRoles(admin.getRoles());
        return profile;
    }

    public void updateProfile(long adminId, Map<String, Object> body) {
        String missingField = RequestUtils.requireBodyField(body, "name");
        if (missingField != null) {
            throw new ApiException("缺少字段：" + missingField, 400);
        }

        String name = RequestUtils.trimToEmpty(body.get("name"));
        String phone = RequestUtils.trimToEmpty(body.get("phone"));
        String email = RequestUtils.trimToEmpty(body.get("email"));
        String avatar = RequestUtils.trimToEmpty(body.get("avatar"));

        if (name.isEmpty()) {
            throw new ApiException("姓名不能为空", 400);
        }
        if (!phone.isEmpty() && !phone.matches("^1\\d{10}$")) {
            throw new ApiException("请输入正确的手机号", 400);
        }
        if (!email.isEmpty() && !email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new ApiException("请输入正确的邮箱地址", 400);
        }

        adminUserMapper.updateProfile(adminId, name, phone, email, avatar);
    }

    public void changePassword(long adminId, Map<String, Object> body) {
        String missingField = RequestUtils.requireBodyField(body, "oldPassword", "newPassword");
        if (missingField != null) {
            throw new ApiException("缺少字段：" + missingField, 400);
        }

        String oldPassword = String.valueOf(body.get("oldPassword"));
        String newPassword = String.valueOf(body.get("newPassword"));

        if (newPassword.length() < 6) {
            throw new ApiException("新密码至少需要 6 位", 400);
        }
        if (oldPassword.equals(newPassword)) {
            throw new ApiException("新密码不能与当前密码相同", 400);
        }

        String storedPassword = adminUserMapper.findPasswordById(adminId);
        if (storedPassword == null || !passwordService.verifyPassword(oldPassword, storedPassword)) {
            throw new ApiException("当前密码错误", 400);
        }

        adminUserMapper.updatePassword(adminId, passwordService.hashPassword(newPassword));
    }

    public List<AdminSessionDevice> listDevices(long adminId) {
        return adminSessionMapper.listDevicesByAdminUserId(adminId);
    }

    public void revokeDevice(long adminId, long sessionId) {
        if (adminSessionMapper.revokeOnlineDevice(sessionId, adminId) == 0) {
            throw new ApiException("设备不存在或已离线", 404);
        }
    }

    public List<AdminIntegrationItem> listIntegrations(long adminId) {
        return adminIntegrationMapper.listByAdminUserId(adminId);
    }

    public void bindIntegration(long adminId, long integrationId, Map<String, Object> body) {
        String accountName = RequestUtils.trimToEmpty(body.get("accountName"));
        if (accountName.isEmpty()) {
            throw new ApiException("请输入关联账号", 400);
        }

        AdminIntegrationItem integration = adminIntegrationMapper.findById(integrationId);
        if (integration == null) {
            throw new ApiException("应用不存在", 404);
        }
        if (!"启用".equals(integration.getStatus())) {
            throw new ApiException("该应用暂不可绑定", 400);
        }

        adminIntegrationMapper.upsertBinding(adminId, integrationId, accountName);
    }

    public void unbindIntegration(long adminId, long integrationId) {
        if (adminIntegrationMapper.deleteBinding(adminId, integrationId) == 0) {
            throw new ApiException("绑定记录不存在", 404);
        }
    }
}
