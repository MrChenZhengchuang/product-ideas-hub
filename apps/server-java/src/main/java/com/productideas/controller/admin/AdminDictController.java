package com.productideas.controller.admin;

import com.productideas.common.ApiResponse;
import com.productideas.common.PageResult;
import com.productideas.util.RequestUtils;
import com.productideas.domain.DictItemNode;
import com.productideas.domain.DictTypeItem;
import com.productideas.security.RequirePermission;
import com.productideas.service.admin.AdminDictService;
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
public class AdminDictController {

    private final AdminDictService adminDictService;

    public AdminDictController(AdminDictService adminDictService) {
        this.adminDictService = adminDictService;
    }

    @GetMapping("/dict-types")
    @RequirePermission("dict.edit")
    public ApiResponse<PageResult<DictTypeItem>> listTypes(
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) Integer page,
        @RequestParam(required = false) Integer pageSize
    ) {
        return ApiResponse.ok(adminDictService.listTypes(keyword, status, RequestUtils.parsePage(page, pageSize)));
    }

    @PostMapping("/dict-types")
    @RequirePermission("dict.create")
    public ApiResponse<Map<String, Long>> createType(@RequestBody Map<String, Object> body) {
        long id = adminDictService.createType(body);
        return ApiResponse.ok(Map.of("id", id), "字典类型创建成功");
    }

    @PutMapping("/dict-types/{id}")
    @RequirePermission("dict.edit")
    public ApiResponse<Void> updateType(@PathVariable long id, @RequestBody Map<String, Object> body) {
        adminDictService.updateType(id, body);
        return ApiResponse.okMessage("字典类型更新成功");
    }

    @DeleteMapping("/dict-types/{id}")
    @RequirePermission("dict.delete")
    public ApiResponse<Void> deleteType(@PathVariable long id) {
        adminDictService.deleteType(id);
        return ApiResponse.okMessage("字典类型删除成功");
    }

    @GetMapping("/dict-types/{id}/items")
    @RequirePermission("dict.edit")
    public ApiResponse<PageResult<DictItemNode>> listItems(
        @PathVariable long id,
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String viewMode,
        @RequestParam(required = false) Integer page,
        @RequestParam(required = false) Integer pageSize
    ) {
        return ApiResponse.ok(
            adminDictService.listItems(id, keyword, status, viewMode, RequestUtils.parsePage(page, pageSize))
        );
    }

    @PostMapping("/dict-items")
    @RequirePermission("dict.create")
    public ApiResponse<Map<String, Long>> createItem(@RequestBody Map<String, Object> body) {
        long itemId = adminDictService.createItem(body);
        return ApiResponse.ok(Map.of("id", itemId), "字典项创建成功");
    }

    @PutMapping("/dict-items/{id}")
    @RequirePermission("dict.edit")
    public ApiResponse<Void> updateItem(@PathVariable long id, @RequestBody Map<String, Object> body) {
        adminDictService.updateItem(id, body);
        return ApiResponse.okMessage("字典项更新成功");
    }

    @DeleteMapping("/dict-items/{id}")
    @RequirePermission("dict.delete")
    public ApiResponse<Void> deleteItem(@PathVariable long id) {
        adminDictService.deleteItem(id);
        return ApiResponse.okMessage("字典项删除成功");
    }
}
