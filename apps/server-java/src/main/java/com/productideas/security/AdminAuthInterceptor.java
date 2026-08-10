package com.productideas.security;

import com.productideas.common.ApiException;
import com.productideas.domain.AdminUser;
import com.productideas.service.admin.AdminAuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Map;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AdminAuthInterceptor implements HandlerInterceptor {

    private final TokenService tokenService;
    private final AdminAuthService adminAuthService;

    public AdminAuthInterceptor(TokenService tokenService, AdminAuthService adminAuthService) {
        this.tokenService = tokenService;
        this.adminAuthService = adminAuthService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String token = ClientAuthInterceptor.extractBearerToken(request);
        Map<String, Object> payload = tokenService.verifyToken(token);

        Object adminIdValue = payload.get("adminId");
        if (!(adminIdValue instanceof Number adminIdNumber)) {
            throw new ApiException("登录已失效，请重新登录", 401);
        }

        long adminId = adminIdNumber.longValue();
        Object sessionIdValue = payload.get("sessionId");
        Long sessionId = sessionIdValue instanceof Number sessionNumber ? sessionNumber.longValue() : null;

        if (sessionId != null) {
            adminAuthService.assertActiveSession(sessionId, adminId);
            adminAuthService.touchSession(sessionId);
        }

        AdminUser admin = adminAuthService.loadAdminDetail(adminId);
        if (admin == null) {
            throw new ApiException("管理员不存在", 401);
        }

        admin.setSessionId(sessionId);
        request.setAttribute(AuthContext.ADMIN_USER, admin);
        return true;
    }
}
