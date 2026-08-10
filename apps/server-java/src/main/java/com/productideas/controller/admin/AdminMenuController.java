package com.productideas.controller.admin;

import com.productideas.common.ApiResponse;
import com.productideas.domain.MenuNode;
import com.productideas.security.RequirePermission;
import com.productideas.service.admin.AdminAuthorizationService;
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
@RequestMapping("/api/admin/menus")
public class AdminMenuController {

    private final AdminAuthorizationService adminAuthorizationService;

    public AdminMenuController(AdminAuthorizationService adminAuthorizationService) {
        this.adminAuthorizationService = adminAuthorizationService;
    }

    @GetMapping
    @RequirePermission("menu.view")
    public ApiResponse<List<MenuNode>> list() {
        return ApiResponse.ok(adminAuthorizationService.listMenus());
    }

    @PostMapping
    @RequirePermission("menu.create")
    public ApiResponse<Map<String, Long>> create(@RequestBody Map<String, Object> body) {
        long id = adminAuthorizationService.createMenu(body);
        return ApiResponse.ok(Map.of("id", id), "菜单创建成功");
    }

    @PutMapping("/{id}")
    @RequirePermission("menu.edit")
    public ApiResponse<Void> update(@PathVariable long id, @RequestBody Map<String, Object> body) {
        adminAuthorizationService.updateMenu(id, body);
        return ApiResponse.okMessage("菜单更新成功");
    }

    @DeleteMapping("/{id}")
    @RequirePermission("menu.delete")
    public ApiResponse<Void> delete(@PathVariable long id) {
        adminAuthorizationService.deleteMenu(id);
        return ApiResponse.okMessage("菜单删除成功");
    }
}
