package com.productideas.controller.admin;

import com.productideas.common.ApiResponse;
import com.productideas.mapper.DashboardMapper;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminDashboardController {

    private final DashboardMapper dashboardMapper;

    public AdminDashboardController(DashboardMapper dashboardMapper) {
        this.dashboardMapper = dashboardMapper;
    }

    @GetMapping("/dashboard")
    public ApiResponse<Map<String, Long>> dashboard() {
        Map<String, Long> stats = new LinkedHashMap<>();
        stats.put("systemUsers", dashboardMapper.countAdminUsers());
        stats.put("roles", dashboardMapper.countRoles());
        stats.put("siteUsers", dashboardMapper.countSiteUsers());
        stats.put("projects", dashboardMapper.countProjects());
        return ApiResponse.ok(stats);
    }
}
