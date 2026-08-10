package com.productideas.service.admin;

import com.productideas.common.ApiException;
import com.productideas.common.PageQuery;
import com.productideas.common.PageResult;
import com.productideas.domain.RoleDetail;
import com.productideas.domain.RoleListItem;
import com.productideas.mapper.RoleMapper;
import com.productideas.util.RequestUtils;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminRoleService {

    private final RoleMapper roleMapper;
    private final AdminMenuTreeService adminMenuTreeService;

    public AdminRoleService(RoleMapper roleMapper, AdminMenuTreeService adminMenuTreeService) {
        this.roleMapper = roleMapper;
        this.adminMenuTreeService = adminMenuTreeService;
    }

    private boolean hasStatusColumn() {
        return roleMapper.hasStatusColumn();
    }

    public PageResult<RoleListItem> list(PageQuery pageQuery) {
        long total = roleMapper.countRoles();
        List<RoleListItem> rows = roleMapper.listRoles(
            hasStatusColumn(),
            pageQuery.getLimit(),
            pageQuery.getOffset()
        );
        return PageResult.of(rows, total, pageQuery);
    }

    public RoleDetail getById(long id) {
        RoleDetail role = roleMapper.findById(id, hasStatusColumn());
        if (role == null) {
            throw new ApiException("角色不存在", 404);
        }
        role.setPermissionIds(roleMapper.listPermissionIdsByRoleId(id));
        role.setMenuIds(adminMenuTreeService.expandMenuIdsWithAncestors(roleMapper.listMenuIdsByRoleId(id)));
        return role;
    }

    public long create(Map<String, Object> body) {
        String missingField = RequestUtils.requireBodyField(body, "name", "scope");
        if (missingField != null) {
            throw new ApiException(missingField + " 不能为空", 400);
        }

        RoleDetail role = new RoleDetail();
        role.setName(String.valueOf(body.get("name")));
        role.setScope(String.valueOf(body.get("scope")));
        if (hasStatusColumn()) {
            role.setStatus(body.get("status") == null ? "启用" : String.valueOf(body.get("status")));
            roleMapper.insertWithStatus(role);
        } else {
            roleMapper.insertBasic(role);
        }
        return role.getId();
    }

    public void update(long id, Map<String, Object> body) {
        String missingField = RequestUtils.requireBodyField(body, "name", "scope");
        if (missingField != null) {
            throw new ApiException(missingField + " 不能为空", 400);
        }

        RoleDetail role = new RoleDetail();
        role.setId(id);
        role.setName(String.valueOf(body.get("name")));
        role.setScope(String.valueOf(body.get("scope")));
        if (hasStatusColumn()) {
            role.setStatus(body.get("status") == null ? "启用" : String.valueOf(body.get("status")));
            roleMapper.updateWithStatus(role);
        } else {
            roleMapper.updateBasic(role);
        }
    }

    public String updateStatus(long id, Map<String, Object> body) {
        if (!hasStatusColumn()) {
            return "当前数据库未启用角色状态字段";
        }
        if (body == null || body.get("status") == null) {
            throw new ApiException("status 不能为空", 400);
        }
        roleMapper.updateStatus(id, String.valueOf(body.get("status")));
        return "角色状态已更新";
    }

    @Transactional
    public void updatePermissions(long id, Map<String, Object> body) {
        List<Long> permissionIds = RequestUtils.normalizeNumberArray(body == null ? null : body.get("permissionIds"));
        roleMapper.deleteRolePermissions(id);
        for (Long permissionId : permissionIds) {
            roleMapper.insertRolePermission(id, permissionId);
        }
    }

    @Transactional
    public void updateMenus(long id, Map<String, Object> body) {
        List<Long> menuIds = RequestUtils.normalizeNumberArray(body == null ? null : body.get("menuIds"));
        List<Long> expandedMenuIds = adminMenuTreeService.expandMenuIdsWithAncestors(menuIds);
        roleMapper.deleteRoleMenus(id);
        for (Long menuId : expandedMenuIds) {
            roleMapper.insertRoleMenu(id, menuId);
        }
    }

    @Transactional
    public void delete(long id) {
        if (roleMapper.countMembers(id) > 0) {
            throw new ApiException("该角色下仍有关联用户，无法删除", 400);
        }
        roleMapper.deleteRolePermissions(id);
        roleMapper.deleteRoleMenus(id);
        roleMapper.deleteById(id);
    }
}
