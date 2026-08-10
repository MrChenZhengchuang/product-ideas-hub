package com.productideas.controller.admin;

import com.productideas.common.ApiResponse;
import com.productideas.common.PageResult;
import com.productideas.util.RequestUtils;
import com.productideas.domain.AdminProjectItem;
import com.productideas.domain.AdminUser;
import com.productideas.domain.ProjectCategoryAdmin;
import com.productideas.security.AuthContextHelper;
import com.productideas.security.RequirePermission;
import com.productideas.service.admin.AdminProjectService;
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
@RequestMapping("/api/admin")
public class AdminProjectController {

    private final AdminProjectService adminProjectService;

    public AdminProjectController(AdminProjectService adminProjectService) {
        this.adminProjectService = adminProjectService;
    }

    @GetMapping("/project-categories")
    @RequirePermission("project.view")
    public ApiResponse<List<ProjectCategoryAdmin>> listCategories() {
        return ApiResponse.ok(adminProjectService.listCategories());
    }

    @GetMapping("/projects")
    @RequirePermission("project.view")
    public ApiResponse<PageResult<AdminProjectItem>> list(
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) String category,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String auditStatus,
        @RequestParam(required = false) Integer page,
        @RequestParam(required = false) Integer pageSize
    ) {
        return ApiResponse.ok(
            adminProjectService.list(keyword, category, status, auditStatus, RequestUtils.parsePage(page, pageSize))
        );
    }

    @PostMapping("/projects")
    @RequirePermission("project.create")
    public ApiResponse<Map<String, Long>> create(HttpServletRequest request, @RequestBody Map<String, Object> body) {
        AdminUser admin = AuthContextHelper.requireAdmin(request);
        long id = adminProjectService.create(body, admin.getId());
        return ApiResponse.ok(Map.of("id", id), "项目创建成功");
    }

    @PutMapping("/projects/{id}")
    @RequirePermission("project.edit")
    public ApiResponse<Void> update(
        HttpServletRequest request,
        @PathVariable long id,
        @RequestBody Map<String, Object> body
    ) {
        AdminUser admin = AuthContextHelper.requireAdmin(request);
        adminProjectService.update(id, body, admin.getId());
        return ApiResponse.okMessage("项目更新成功");
    }

    @PatchMapping("/projects/{id}/status")
    @RequirePermission("project.publish")
    public ApiResponse<Void> updateStatus(@PathVariable long id, @RequestBody Map<String, Object> body) {
        adminProjectService.updateStatus(id, body);
        return ApiResponse.okMessage("项目状态更新成功");
    }

    @PostMapping("/projects/{id}/audit")
    @RequirePermission("project.audit")
    public ApiResponse<Void> audit(
        HttpServletRequest request,
        @PathVariable long id,
        @RequestBody Map<String, Object> body
    ) {
        AdminUser admin = AuthContextHelper.requireAdmin(request);
        String message = adminProjectService.audit(id, body, admin.getId());
        return ApiResponse.okMessage(message);
    }

    @DeleteMapping("/projects/{id}")
    @RequirePermission("project.delete")
    public ApiResponse<Void> delete(@PathVariable long id) {
        adminProjectService.delete(id);
        return ApiResponse.okMessage("项目删除成功");
    }
}
