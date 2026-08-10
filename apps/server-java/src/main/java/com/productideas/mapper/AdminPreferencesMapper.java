package com.productideas.mapper;

import com.productideas.domain.AdminPreferences;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface AdminPreferencesMapper {

    @Select("""
        SELECT
          color_primary AS colorPrimary,
          show_page_tabs AS showPageTabs,
          compact_content AS compactContent
        FROM admin_preferences
        WHERE admin_user_id = #{adminUserId}
        LIMIT 1
        """)
    AdminPreferences findByAdminUserId(@Param("adminUserId") long adminUserId);

    @Insert("""
        INSERT INTO admin_preferences (admin_user_id, color_primary, show_page_tabs, compact_content)
        VALUES (#{adminUserId}, #{preferences.colorPrimary}, #{preferences.showPageTabs}, #{preferences.compactContent})
        ON DUPLICATE KEY UPDATE
          color_primary = VALUES(color_primary),
          show_page_tabs = VALUES(show_page_tabs),
          compact_content = VALUES(compact_content)
        """)
    int upsert(@Param("adminUserId") long adminUserId, @Param("preferences") AdminPreferences preferences);
}
