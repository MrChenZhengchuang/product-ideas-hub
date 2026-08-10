package com.productideas.controller.admin;

import com.productideas.common.ApiResponse;
import com.productideas.common.PageResult;
import com.productideas.domain.AdminUser;
import com.productideas.domain.SystemUserItem;
import com.productideas.security.AuthContextHelper;
import com.productideas.security.RequirePermission;
import com.productideas.service.admin.AdminSystemUserService;
import com.productideas.util.RequestUtils;
import jakarta.servlet.http.HttpServletRequest;
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
@RequestMapping("/api/admin/system-users")
public class AdminSystemUserController {

    private final AdminSystemUserService adminSystemUserService;

    public AdminSystemUserController(AdminSystemUserService adminSystemUserService) {
        this.adminSystemUserService = adminSystemUserService;
    }

    @GetMapping
    @RequirePermission("system_user.view")
    public ApiResponse<PageResult<SystemUserItem>> list(
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) Integer page,
        @RequestParam(required = false) Integer pageSize
    ) {
        return ApiResponse.ok(adminSystemUserService.list(keyword, status, RequestUtils.parsePage(page, pageSize)));
    }

    @PostMapping
    @RequirePermission("system_user.create")
    public ApiResponse<Map<String, Long>> create(@RequestBody Map<String, Object> body) {
        long id = adminSystemUserService.create(body);
        return ApiResponse.ok(Map.of("id", id), "系统用户创建成功");
    }

    @PutMapping("/{id}")
    @RequirePermission("system_user.edit")
    public ApiResponse<Void> update(@PathVariable long id, @RequestBody Map<String, Object> body) {
        adminSystemUserService.update(id, body);
        return ApiResponse.okMessage("系统用户更新成功");
    }

    @PatchMapping("/{id}/status")
    @RequirePermission("system_user.edit")
    public ApiResponse<Void> updateStatus(@PathVariable long id, @RequestBody Map<String, Object> body) {
        adminSystemUserService.updateStatus(id, body);
        return ApiResponse.okMessage("状态更新成功");
    }

    @DeleteMapping("/{id}")
    @RequirePermission("system_user.delete")
    public ApiResponse<Void> delete(HttpServletRequest request, @PathVariable long id) {
        AdminUser admin = AuthContextHelper.requireAdmin(request);
        adminSystemUserService.delete(id, admin.getId());
        return ApiResponse.okMessage("系统用户删除成功");
    }
}
