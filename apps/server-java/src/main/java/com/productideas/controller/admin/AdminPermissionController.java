package com.productideas.controller.admin;

import com.productideas.common.ApiResponse;
import com.productideas.domain.AuthorizationTreeNode;
import com.productideas.domain.PermissionGroupItem;
import com.productideas.security.RequirePermission;
import com.productideas.service.admin.AdminAuthorizationService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminPermissionController {

    private final AdminAuthorizationService adminAuthorizationService;

    public AdminPermissionController(AdminAuthorizationService adminAuthorizationService) {
        this.adminAuthorizationService = adminAuthorizationService;
    }

    @GetMapping("/permissions")
    @RequirePermission("permission.view")
    public ApiResponse<List<PermissionGroupItem>> listPermissions() {
        return ApiResponse.ok(adminAuthorizationService.listPermissionGroups());
    }

    @GetMapping("/authorization-tree")
    @RequirePermission("role.assign")
    public ApiResponse<List<AuthorizationTreeNode>> authorizationTree() {
        return ApiResponse.ok(adminAuthorizationService.getAuthorizationTree());
    }
}
