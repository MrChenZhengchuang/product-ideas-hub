package com.productideas.controller.admin;

import com.productideas.common.ApiResponse;
import com.productideas.common.PageResult;
import com.productideas.util.RequestUtils;
import com.productideas.domain.RoleDetail;
import com.productideas.domain.RoleListItem;
import com.productideas.security.RequirePermission;
import com.productideas.service.admin.AdminRoleService;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/roles")
public class AdminRoleController {

    private final AdminRoleService adminRoleService;

    public AdminRoleController(AdminRoleService adminRoleService) {
        this.adminRoleService = adminRoleService;
    }

    @GetMapping
    @RequirePermission("role.view")
    public ApiResponse<PageResult<RoleListItem>> list(
        @RequestParam(required = false) Integer page,
        @RequestParam(required = false) Integer pageSize
    ) {
        return ApiResponse.ok(adminRoleService.list(RequestUtils.parsePage(page, pageSize)));
    }

    @GetMapping("/{id}")
    @RequirePermission("role.view")
    public ApiResponse<RoleDetail> getById(@PathVariable long id) {
        return ApiResponse.ok(adminRoleService.getById(id));
    }

    @PostMapping
    @RequirePermission("role.create")
    public ApiResponse<Map<String, Long>> create(@RequestBody Map<String, Object> body) {
        long id = adminRoleService.create(body);
        return ApiResponse.ok(Map.of("id", id), "角色创建成功");
    }

    @PutMapping("/{id}")
    @RequirePermission("role.edit")
    public ApiResponse<Void> update(@PathVariable long id, @RequestBody Map<String, Object> body) {
        adminRoleService.update(id, body);
        return ApiResponse.okMessage("角色更新成功");
    }

    @PatchMapping("/{id}/status")
    @RequirePermission("role.edit")
    public ApiResponse<Void> updateStatus(@PathVariable long id, @RequestBody Map<String, Object> body) {
        String message = adminRoleService.updateStatus(id, body);
        return ApiResponse.okMessage(message);
    }

    @PutMapping("/{id}/permissions")
    @RequirePermission("role.assign")
    public ApiResponse<Void> updatePermissions(@PathVariable long id, @RequestBody Map<String, Object> body) {
        adminRoleService.updatePermissions(id, body);
        return ApiResponse.okMessage("角色权限分配成功");
    }

    @PutMapping("/{id}/menus")
    @RequirePermission("role.assign")
    public ApiResponse<Void> updateMenus(@PathVariable long id, @RequestBody Map<String, Object> body) {
        adminRoleService.updateMenus(id, body);
        return ApiResponse.okMessage("角色菜单分配成功");
    }

    @DeleteMapping("/{id}")
    @RequirePermission("role.delete")
    public ApiResponse<Void> delete(@PathVariable long id) {
        adminRoleService.delete(id);
        return ApiResponse.okMessage("角色删除成功");
    }
}
