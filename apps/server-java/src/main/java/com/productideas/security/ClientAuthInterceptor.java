package com.productideas.security;

import com.productideas.common.ApiException;
import com.productideas.domain.SiteUser;
import com.productideas.mapper.SiteUserMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Map;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class ClientAuthInterceptor implements HandlerInterceptor {

    private final TokenService tokenService;
    private final SiteUserMapper siteUserMapper;

    public ClientAuthInterceptor(TokenService tokenService, SiteUserMapper siteUserMapper) {
        this.tokenService = tokenService;
        this.siteUserMapper = siteUserMapper;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        if (isPublicReadPath(request)) {
            return true;
        }

        String token = extractBearerToken(request);
        Map<String, Object> payload = tokenService.verifyToken(token);
        Object siteUserId = payload.get("siteUserId");
        if (!(siteUserId instanceof Number number)) {
            throw new ApiException("登录已失效，请重新登录", 401);
        }

        SiteUser user = siteUserMapper.findById(number.longValue());
        if (user == null) {
            throw new ApiException("当前用户不存在", 401);
        }

        request.setAttribute(AuthContext.CLIENT_USER, user);
        return true;
    }

    static boolean isPublicReadPath(HttpServletRequest request) {
        if (!"GET".equalsIgnoreCase(request.getMethod())) {
            return false;
        }

        String path = request.getRequestURI();
        String contextPath = request.getContextPath();
        if (contextPath != null && !contextPath.isEmpty() && path.startsWith(contextPath)) {
            path = path.substring(contextPath.length());
        }

        return "/api/client/categories".equals(path) || "/api/client/projects".equals(path);
    }

    static String extractBearerToken(HttpServletRequest request) {
        String authorization = request.getHeader("Authorization");
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new ApiException("请先登录", 401);
        }
        return authorization.substring(7);
    }
}
