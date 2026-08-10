package com.productideas.controller.admin;

import com.productideas.common.ApiResponse;
import com.productideas.common.PageResult;
import com.productideas.util.RequestUtils;
import com.productideas.domain.SiteUserAdminItem;
import com.productideas.security.RequirePermission;
import com.productideas.service.admin.AdminSiteUserService;
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
@RequestMapping("/api/admin/site-users")
public class AdminSiteUserController {

    private final AdminSiteUserService adminSiteUserService;

    public AdminSiteUserController(AdminSiteUserService adminSiteUserService) {
        this.adminSiteUserService = adminSiteUserService;
    }

    @GetMapping
    @RequirePermission("site_user.view")
    public ApiResponse<PageResult<SiteUserAdminItem>> list(
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) Integer page,
        @RequestParam(required = false) Integer pageSize
    ) {
        return ApiResponse.ok(adminSiteUserService.list(keyword, status, RequestUtils.parsePage(page, pageSize)));
    }

    @PostMapping
    @RequirePermission("site_user.tag")
    public ApiResponse<Map<String, Long>> create(@RequestBody Map<String, Object> body) {
        long id = adminSiteUserService.create(body);
        return ApiResponse.ok(Map.of("id", id), "网站用户创建成功");
    }

    @PutMapping("/{id}")
    @RequirePermission("site_user.tag")
    public ApiResponse<Void> update(@PathVariable long id, @RequestBody Map<String, Object> body) {
        adminSiteUserService.update(id, body);
        return ApiResponse.okMessage("网站用户更新成功");
    }

    @PatchMapping("/{id}/status")
    @RequirePermission("site_user.freeze")
    public ApiResponse<Void> updateStatus(@PathVariable long id, @RequestBody Map<String, Object> body) {
        adminSiteUserService.updateStatus(id, body);
        return ApiResponse.okMessage("网站用户状态更新成功");
    }

    @DeleteMapping("/{id}")
    @RequirePermission("site_user.tag")
    public ApiResponse<Void> delete(@PathVariable long id) {
        adminSiteUserService.delete(id);
        return ApiResponse.okMessage("网站用户删除成功");
    }
}
