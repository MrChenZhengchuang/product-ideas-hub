package com.productideas.service.admin;

import com.productideas.common.ApiException;
import com.productideas.common.PageQuery;
import com.productideas.common.PageResult;
import com.productideas.domain.AdminUser;
import com.productideas.domain.AdminUserRoleRow;
import com.productideas.domain.SystemUserItem;
import com.productideas.mapper.AdminUserMapper;
import com.productideas.security.PasswordService;
import com.productideas.util.RequestUtils;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminSystemUserService {

    private final AdminUserMapper adminUserMapper;
    private final PasswordService passwordService;

    public AdminSystemUserService(AdminUserMapper adminUserMapper, PasswordService passwordService) {
        this.adminUserMapper = adminUserMapper;
        this.passwordService = passwordService;
    }

    public PageResult<SystemUserItem> list(String keyword, String status, PageQuery pageQuery) {
        String normalizedKeyword = keyword == null ? "" : keyword.trim();
        String normalizedStatus = status == null ? "" : status.trim();
        long total = adminUserMapper.countSystemUsers(normalizedKeyword, normalizedStatus);
        List<SystemUserItem> rows = adminUserMapper.listSystemUsers(
            normalizedKeyword,
            normalizedStatus,
            pageQuery.getLimit(),
            pageQuery.getOffset()
        );
        List<Long> userIds = rows.stream().map(SystemUserItem::getId).toList();
        List<AdminUserRoleRow> roleRows = userIds.isEmpty()
            ? List.of()
            : adminUserMapper.listUserRolesByUserIds(userIds);
        Map<Long, List<AdminUserRoleRow>> roleMap = new LinkedHashMap<>();
        for (AdminUserRoleRow roleRow : roleRows) {
            roleMap.computeIfAbsent(roleRow.getAdminUserId(), key -> new ArrayList<>()).add(roleRow);
        }

        for (SystemUserItem item : rows) {
            List<AdminUserRoleRow> userRoles = roleMap.getOrDefault(item.getId(), List.of());
            item.setRoleIds(userRoles.stream().map(AdminUserRoleRow::getRoleId).toList());
            item.setRoles(userRoles.stream().map(AdminUserRoleRow::getRoleName).toList());
        }
        return PageResult.of(rows, total, pageQuery);
    }

    @Transactional
    public long create(Map<String, Object> body) {
        String missingField = RequestUtils.requireBodyField(body, "name", "account", "password", "status", "departmentId");
        List<Long> roleIds = RequestUtils.normalizeNumberArray(body.get("roleIds"));
        if (missingField != null || roleIds.isEmpty()) {
            throw new ApiException(missingField != null ? missingField + " 不能为空" : "请至少选择一个角色", 400);
        }

        AdminUser user = new AdminUser();
        user.setName(String.valueOf(body.get("name")));
        user.setAccount(String.valueOf(body.get("account")));
        user.setPassword(passwordService.hashPassword(String.valueOf(body.get("password"))));
        user.setRoleId(roleIds.get(0));
        user.setDepartmentId(toLong(body.get("departmentId")));
        user.setStatus(String.valueOf(body.get("status")));
        adminUserMapper.insertSystemUser(user);
        syncRoles(user.getId(), roleIds);
        return user.getId();
    }

    @Transactional
    public void update(long id, Map<String, Object> body) {
        String missingField = RequestUtils.requireBodyField(body, "name", "account", "status", "departmentId");
        List<Long> roleIds = RequestUtils.normalizeNumberArray(body.get("roleIds"));
        if (missingField != null || roleIds.isEmpty()) {
            throw new ApiException(missingField != null ? missingField + " 不能为空" : "请至少选择一个角色", 400);
        }

        AdminUser user = new AdminUser();
        user.setId(id);
        user.setName(String.valueOf(body.get("name")));
        user.setAccount(String.valueOf(body.get("account")));
        user.setRoleId(roleIds.get(0));
        user.setDepartmentId(toLong(body.get("departmentId")));
        user.setStatus(String.valueOf(body.get("status")));
        adminUserMapper.updateSystemUser(user);

        Object password = body.get("password");
        if (password != null && !String.valueOf(password).isEmpty()) {
            adminUserMapper.updatePassword(id, passwordService.hashPassword(String.valueOf(password)));
        }

        syncRoles(id, roleIds);
    }

    public void updateStatus(long id, Map<String, Object> body) {
        if (body == null || body.get("status") == null || String.valueOf(body.get("status")).isEmpty()) {
            throw new ApiException("status 不能为空", 400);
        }
        adminUserMapper.updateStatus(id, String.valueOf(body.get("status")));
    }

    @Transactional
    public void delete(long id, long currentAdminId) {
        if (id == currentAdminId) {
            throw new ApiException("不能删除当前登录账号", 400);
        }
        adminUserMapper.deleteUserRoles(id);
        adminUserMapper.deleteById(id);
    }

    private void syncRoles(long adminUserId, List<Long> roleIds) {
        adminUserMapper.deleteUserRoles(adminUserId);
        for (Long roleId : roleIds) {
            adminUserMapper.insertUserRole(adminUserId, roleId);
        }
    }

    private static Long toLong(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        return Long.parseLong(String.valueOf(value));
    }
}
