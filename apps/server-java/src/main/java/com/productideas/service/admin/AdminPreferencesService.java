package com.productideas.service.admin;

import com.productideas.common.ApiException;
import com.productideas.domain.AdminPreferences;
import com.productideas.mapper.AdminPreferencesMapper;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class AdminPreferencesService {

    private static final String DEFAULT_COLOR_PRIMARY = "#0f766e";

    private final AdminPreferencesMapper adminPreferencesMapper;

    public AdminPreferencesService(AdminPreferencesMapper adminPreferencesMapper) {
        this.adminPreferencesMapper = adminPreferencesMapper;
    }

    public AdminPreferences getPreferences(long adminUserId) {
        AdminPreferences stored = adminPreferencesMapper.findByAdminUserId(adminUserId);
        return stored == null ? defaultPreferences() : normalize(stored);
    }

    public AdminPreferences savePreferences(long adminUserId, Map<String, Object> body) {
        AdminPreferences preferences = normalize(fromBody(body));

        if (!preferences.getColorPrimary().matches("(?i)^#[0-9a-fA-F]{6}$")) {
            throw new ApiException("主题主色格式不正确", 400);
        }

        adminPreferencesMapper.upsert(adminUserId, preferences);
        return normalize(preferences);
    }

    private static AdminPreferences defaultPreferences() {
        AdminPreferences preferences = new AdminPreferences();
        preferences.setColorPrimary(DEFAULT_COLOR_PRIMARY);
        preferences.setShowPageTabs(true);
        preferences.setCompactContent(false);
        return preferences;
    }

    private static AdminPreferences fromBody(Map<String, Object> body) {
        AdminPreferences preferences = new AdminPreferences();
        Object colorPrimary = body.get("colorPrimary");
        Object showPageTabs = body.get("showPageTabs");
        Object compactContent = body.get("compactContent");

        preferences.setColorPrimary(colorPrimary instanceof String text && !text.isBlank() ? text.trim() : DEFAULT_COLOR_PRIMARY);
        preferences.setShowPageTabs(!(showPageTabs instanceof Boolean flag) || flag);
        preferences.setCompactContent(compactContent instanceof Boolean flag && flag);
        return preferences;
    }

    private static AdminPreferences normalize(AdminPreferences value) {
        AdminPreferences preferences = defaultPreferences();
        if (value == null) {
            return preferences;
        }

        if (value.getColorPrimary() != null && !value.getColorPrimary().isBlank()) {
            preferences.setColorPrimary(value.getColorPrimary().trim());
        }
        preferences.setShowPageTabs(value.isShowPageTabs());
        preferences.setCompactContent(value.isCompactContent());
        return preferences;
    }
}
