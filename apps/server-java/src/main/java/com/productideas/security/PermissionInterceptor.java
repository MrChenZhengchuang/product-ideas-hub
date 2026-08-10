package com.productideas.security;

import com.productideas.common.ApiException;
import com.productideas.domain.AdminUser;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.lang.reflect.Method;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class PermissionInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!(handler instanceof HandlerMethod handlerMethod)) {
            return true;
        }

        RequirePermission annotation = resolveAnnotation(handlerMethod);
        if (annotation == null) {
            return true;
        }

        AdminUser admin = AuthContextHelper.requireAdmin(request);
        if (admin.getRoles() != null && admin.getRoles().contains("超级管理员")) {
            return true;
        }

        if (admin.getPermissions() == null || !admin.getPermissions().contains(annotation.value())) {
            throw new ApiException("暂无操作权限", 403);
        }

        return true;
    }

    private static RequirePermission resolveAnnotation(HandlerMethod handlerMethod) {
        RequirePermission methodAnnotation = handlerMethod.getMethodAnnotation(RequirePermission.class);
        if (methodAnnotation != null) {
            return methodAnnotation;
        }
        return handlerMethod.getBeanType().getAnnotation(RequirePermission.class);
    }
}
