package com.productideas.controller.admin;

import com.productideas.common.ApiResponse;
import com.productideas.domain.DepartmentNode;
import com.productideas.domain.DepartmentUserOption;
import com.productideas.security.RequirePermission;
import com.productideas.service.admin.AdminDepartmentService;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminDepartmentController {

    private final AdminDepartmentService adminDepartmentService;

    public AdminDepartmentController(AdminDepartmentService adminDepartmentService) {
        this.adminDepartmentService = adminDepartmentService;
    }

    @GetMapping("/departments")
    @RequirePermission("department.edit")
    public ApiResponse<List<DepartmentNode>> list(@RequestParam(required = false) String keyword) {
        return ApiResponse.ok(adminDepartmentService.list(keyword));
    }

    @PostMapping("/departments")
    @RequirePermission("department.create")
    public ApiResponse<Map<String, Long>> create(@RequestBody Map<String, Object> body) {
        long id = adminDepartmentService.create(body);
        return ApiResponse.ok(Map.of("id", id), "部门创建成功");
    }

    @PutMapping("/departments/{id}")
    @RequirePermission("department.edit")
    public ApiResponse<Void> update(@PathVariable long id, @RequestBody Map<String, Object> body) {
        adminDepartmentService.update(id, body);
        return ApiResponse.okMessage("部门更新成功");
    }

    @DeleteMapping("/departments/{id}")
    @RequirePermission("department.delete")
    public ApiResponse<Void> delete(@PathVariable long id) {
        adminDepartmentService.delete(id);
        return ApiResponse.okMessage("部门删除成功");
    }

    @GetMapping("/department-user-options")
    @RequirePermission("department.edit")
    public ApiResponse<List<DepartmentUserOption>> listUserOptions() {
        return ApiResponse.ok(adminDepartmentService.listUserOptions());
    }
}
