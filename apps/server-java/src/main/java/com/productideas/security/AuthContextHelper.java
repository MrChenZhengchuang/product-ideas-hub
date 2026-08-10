package com.productideas.security;

import com.productideas.common.ApiException;
import com.productideas.domain.AdminUser;
import com.productideas.domain.SiteUser;
import jakarta.servlet.http.HttpServletRequest;

public final class AuthContextHelper {

    private AuthContextHelper() {
    }

    public static AdminUser requireAdmin(HttpServletRequest request) {
        Object value = request.getAttribute(AuthContext.ADMIN_USER);
        if (!(value instanceof AdminUser admin)) {
            throw new ApiException("请先登录", 401);
        }
        return admin;
    }

    public static SiteUser requireSiteUser(HttpServletRequest request) {
        Object value = request.getAttribute(AuthContext.CLIENT_USER);
        if (!(value instanceof SiteUser user)) {
            throw new ApiException("请先登录", 401);
        }
        return user;
    }
}
