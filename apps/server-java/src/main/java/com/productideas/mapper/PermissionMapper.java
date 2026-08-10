package com.productideas.mapper;

import com.productideas.domain.MenuPermissionRow;
import com.productideas.domain.PermissionAuthRow;
import com.productideas.domain.PermissionGroupRow;
import com.productideas.domain.PermissionItem;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface PermissionMapper {

    @Select("SELECT id, permission_code AS permissionCode FROM permissions ORDER BY id ASC")
    List<PermissionItem> listAll();

    List<PermissionItem> listByRoleIds(@Param("roleIds") List<Long> roleIds);

    @Select("""
        SELECT permission_group AS `key`, permission_group_name AS name
        FROM permissions
        GROUP BY permission_group, permission_group_name
        ORDER BY MIN(id) ASC
        """)
    List<PermissionGroupRow> listPermissionGroups();

    @Select("""
        SELECT id, permission_group AS groupKey, permission_code AS permissionCode
        FROM permissions
        ORDER BY id ASC
        """)
    List<PermissionGroupRow> listPermissionGroupItems();

    @Select("""
        SELECT
          id,
          permission_group AS groupKey,
          permission_group_name AS groupName,
          permission_code AS permissionCode,
          menu_id AS menuId
        FROM permissions
        ORDER BY id ASC
        """)
    List<PermissionAuthRow> listAuthorizationPermissions();

    @Select("""
        SELECT id, permission_group_name AS groupName, permission_code AS permissionCode, menu_id AS menuId
        FROM permissions
        WHERE menu_id IS NOT NULL
        ORDER BY id ASC
        """)
    List<MenuPermissionRow> listMenuPermissions();
}
