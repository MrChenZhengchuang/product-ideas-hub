package com.productideas.config;

import com.productideas.security.AdminAuthInterceptor;
import com.productideas.security.ClientAuthInterceptor;
import com.productideas.security.PermissionInterceptor;
import org.springframework.context.annotation.Configuration;
import java.nio.file.Paths;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final AppProperties appProperties;
    private final ClientAuthInterceptor clientAuthInterceptor;
    private final AdminAuthInterceptor adminAuthInterceptor;
    private final PermissionInterceptor permissionInterceptor;

    public WebConfig(
        AppProperties appProperties,
        ClientAuthInterceptor clientAuthInterceptor,
        AdminAuthInterceptor adminAuthInterceptor,
        PermissionInterceptor permissionInterceptor
    ) {
        this.appProperties = appProperties;
        this.clientAuthInterceptor = clientAuthInterceptor;
        this.adminAuthInterceptor = adminAuthInterceptor;
        this.permissionInterceptor = permissionInterceptor;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String uploadDir = Paths.get(appProperties.getUpload().getDir()).toAbsolutePath().normalize() + "/";
        registry.addResourceHandler("/uploads/**")
            .addResourceLocations("file:" + uploadDir);
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
            .allowedOriginPatterns(
                "http://localhost:*",
                "http://127.0.0.1:*",
                appProperties.getCors().getAllowedOriginPattern()
            )
            .allowedMethods("*")
            .allowedHeaders("*")
            .exposedHeaders("*")
            .allowCredentials(false)
            .maxAge(3600);
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(clientAuthInterceptor)
            .addPathPatterns("/api/client/**")
            .excludePathPatterns(
                "/api/client/auth/captcha",
                "/api/client/auth/register",
                "/api/client/auth/login",
                "/api/client/categories",
                "/api/client/projects"
            );

        registry.addInterceptor(adminAuthInterceptor)
            .addPathPatterns("/api/admin/**")
            .excludePathPatterns("/api/admin/auth/**");

        registry.addInterceptor(permissionInterceptor)
            .addPathPatterns("/api/admin/**")
            .excludePathPatterns("/api/admin/auth/**");
    }
}
