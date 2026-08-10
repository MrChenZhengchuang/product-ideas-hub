package com.productideas.service.admin;

import com.productideas.common.ApiException;
import com.productideas.domain.AdminUser;
import com.productideas.domain.MenuNode;
import com.productideas.domain.MenuParentRef;
import com.productideas.domain.PermissionItem;
import com.productideas.domain.RoleItem;
import com.productideas.mapper.AdminSessionMapper;
import com.productideas.mapper.AdminUserMapper;
import com.productideas.mapper.MenuMapper;
import com.productideas.mapper.PermissionMapper;
import com.productideas.security.CaptchaService;
import com.productideas.security.PasswordService;
import com.productideas.security.TokenService;
import com.productideas.util.TreeUtils;
import com.productideas.util.UserAgentUtils;
import jakarta.servlet.http.HttpServletRequest;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminAuthService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final CaptchaService captchaService;
    private final PasswordService passwordService;
    private final TokenService tokenService;
    private final AdminUserMapper adminUserMapper;
    private final AdminSessionMapper adminSessionMapper;
    private final PermissionMapper permissionMapper;
    private final MenuMapper menuMapper;

    public AdminAuthService(
        CaptchaService captchaService,
        PasswordService passwordService,
        TokenService tokenService,
        AdminUserMapper adminUserMapper,
        AdminSessionMapper adminSessionMapper,
        PermissionMapper permissionMapper,
        MenuMapper menuMapper
    ) {
        this.captchaService = captchaService;
        this.passwordService = passwordService;
        this.tokenService = tokenService;
        this.adminUserMapper = adminUserMapper;
        this.adminSessionMapper = adminSessionMapper;
        this.permissionMapper = permissionMapper;
        this.menuMapper = menuMapper;
    }

    public String login(String account, String password, String captchaId, String captchaCode, HttpServletRequest request) {
        String captchaError = captchaService.verifyAndConsume(captchaId, captchaCode);
        if (captchaError != null) {
            throw new ApiException(captchaError, 400);
        }

        AdminUser admin = adminUserMapper.findByAccount(account);
        if (admin == null || !passwordService.verifyPassword(password, admin.getPassword())) {
            throw new ApiException("账号或密码错误", 401);
        }

        if (admin.getPassword() != null && !admin.getPassword().startsWith("scrypt$")) {
            adminUserMapper.updatePassword(admin.getId(), passwordService.hashPassword(password));
        }

        String status = admin.getStatus() == null ? "" : admin.getStatus().trim();
        if (!"启用".equals(status)) {
            throw new ApiException("当前账号不可登录", 403);
        }

        Long sessionId = createAdminSessionSafely(admin.getId(), request);
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("adminId", admin.getId());
        payload.put("roleId", admin.getRoleId());
        if (sessionId != null) {
            payload.put("sessionId", sessionId);
        }
        return tokenService.signToken(payload);
    }

    public void logout(long adminId, Long sessionId) {
        if (sessionId != null) {
            adminSessionMapper.revokeSession(sessionId, adminId);
        }
    }

    public void assertActiveSession(long sessionId, long adminId) {
        Long activeSessionId = adminSessionMapper.findActiveSession(sessionId, adminId);
        if (activeSessionId == null) {
            throw new ApiException("当前登录设备已下线，请重新登录", 401);
        }
    }

    public void touchSession(long sessionId) {
        adminSessionMapper.touchSession(sessionId);
    }

    public AdminUser loadAdminDetail(long adminId) {
        AdminUser admin = adminUserMapper.findDetailById(adminId);
        if (admin == null) {
            return null;
        }

        List<RoleItem> roleRows = adminUserMapper.listRolesByAdminUserId(adminId);
        if (roleRows.isEmpty() && admin.getRoleId() != null) {
            RoleItem fallbackRole = adminUserMapper.findRoleById(admin.getRoleId());
            if (fallbackRole != null) {
                roleRows = List.of(fallbackRole);
            }
        }

        List<Long> roleIds = roleRows.stream().map(RoleItem::getId).toList();
        List<String> roleNames = roleRows.stream().map(RoleItem::getName).toList();
        boolean isSuperAdmin = roleNames.contains("超级管理员");

        List<PermissionItem> permissions = isSuperAdmin
            ? permissionMapper.listAll()
            : roleIds.isEmpty()
                ? List.of()
                : permissionMapper.listByRoleIds(roleIds);

        List<Long> assignedMenuIds = isSuperAdmin
            ? List.of()
            : roleIds.isEmpty()
                ? List.of()
                : menuMapper.listMenuIdsByRoleIds(roleIds);

        List<Long> expandedMenuIds = isSuperAdmin ? assignedMenuIds : expandMenuIdsWithAncestors(assignedMenuIds);
        List<MenuNode> menuRows = isSuperAdmin
            ? menuMapper.listActiveMenus()
            : expandedMenuIds.isEmpty()
                ? List.of()
                : menuMapper.listMenusByIds(expandedMenuIds);

        List<Long> finalMenuIds = isSuperAdmin
            ? menuRows.stream().map(MenuNode::getId).toList()
            : expandedMenuIds;

        List<MenuNode> visibleMenuTree = TreeUtils.buildMenuTree(
            menuRows.stream()
                .filter(item -> "显示".equals(item.getVisible()) && !"button".equals(item.getMenuType()))
                .toList()
        );

        admin.setRoles(roleNames);
        admin.setRoleIds(roleIds);
        admin.setRole(String.join(" / ", roleNames));
        admin.setPermissions(permissions.stream().map(PermissionItem::getPermissionCode).toList());
        admin.setPermissionIds(permissions.stream().map(PermissionItem::getId).toList());
        admin.setMenuIds(finalMenuIds);
        admin.setMenus(visibleMenuTree);
        admin.setPassword(null);
        return admin;
    }

    protected Long createAdminSessionSafely(long adminUserId, HttpServletRequest request) {
        try {
            return createAdminSession(adminUserId, request);
        } catch (DataAccessException exception) {
            String message = exception.getMostSpecificCause().getMessage();
            if (message != null && message.contains("admin_sessions")) {
                return null;
            }
            throw exception;
        }
    }

    @Transactional
    protected long createAdminSession(long adminUserId, HttpServletRequest request) {
        UserAgentUtils.DeviceInfo deviceInfo = UserAgentUtils.parse(request.getHeader("User-Agent"));
        adminSessionMapper.clearCurrentSessions(adminUserId);

        AdminSessionMapper.AdminSessionRecord record = new AdminSessionMapper.AdminSessionRecord();
        record.setAdminUserId(adminUserId);
        record.setSessionToken(randomHex(24));
        record.setDeviceType(deviceInfo.deviceType());
        record.setDeviceName(deviceInfo.deviceName());
        record.setBrowser(deviceInfo.browser());
        record.setOs(deviceInfo.os());
        record.setIpAddress(resolveClientIp(request));
        adminSessionMapper.insert(record);
        return record.getId();
    }

    private List<Long> expandMenuIdsWithAncestors(List<Long> menuIds) {
        if (menuIds == null || menuIds.isEmpty()) {
            return List.of();
        }

        Map<Long, MenuParentRef> menuMap = menuMapper.listMenuParentRefs().stream()
            .collect(Collectors.toMap(MenuParentRef::getId, item -> item, (left, right) -> left));

        Set<Long> expandedIds = new HashSet<>(menuIds);
        for (Long menuId : menuIds) {
            MenuParentRef current = menuMap.get(menuId);
            while (current != null && current.getParentId() != null) {
                expandedIds.add(current.getParentId());
                current = menuMap.get(current.getParentId());
            }
        }

        return expandedIds.stream().sorted().toList();
    }

    private static String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private static String randomHex(int byteLength) {
        byte[] bytes = new byte[byteLength];
        SECURE_RANDOM.nextBytes(bytes);
        StringBuilder builder = new StringBuilder(byteLength * 2);
        for (byte value : bytes) {
            builder.append(String.format("%02x", value));
        }
        return builder.toString();
    }
}
