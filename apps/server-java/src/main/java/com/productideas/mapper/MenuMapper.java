package com.productideas.mapper;

import com.productideas.domain.MenuNode;
import com.productideas.domain.MenuParentRef;
import java.util.List;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface MenuMapper {

    @Select("""
        SELECT
          id,
          parent_id AS parentId,
          name,
          path,
          component,
          permission_code AS permissionCode,
          menu_key AS menuKey,
          menu_type AS menuType,
          icon,
          status,
          visible,
          sort_order AS sortOrder
        FROM menus
        WHERE status = '启用'
        ORDER BY sort_order ASC, id ASC
        """)
    List<MenuNode> listActiveMenus();

    List<MenuNode> listMenusByIds(@Param("menuIds") List<Long> menuIds);

    @Select("""
        SELECT id, parent_id AS parentId
        FROM menus
        """)
    List<MenuParentRef> listMenuParentRefs();

    List<Long> listMenuIdsByRoleIds(@Param("roleIds") List<Long> roleIds);

    @Select("""
        SELECT
          id,
          parent_id AS parentId,
          name,
          path,
          component,
          permission_code AS permissionCode,
          menu_key AS menuKey,
          menu_type AS menuType,
          icon,
          status,
          visible,
          sort_order AS sortOrder
        FROM menus
        ORDER BY sort_order ASC, id ASC
        """)
    List<MenuNode> listAllMenus();

    @Insert("""
        INSERT INTO menus (parent_id, name, path, component, permission_code, menu_key, menu_type, icon, status, visible, sort_order)
        VALUES (#{parentId}, #{name}, #{path}, #{component}, #{permissionCode}, #{menuKey}, #{menuType}, #{icon}, #{status}, #{visible}, #{sortOrder})
        """)
    @org.apache.ibatis.annotations.Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(MenuNode menu);

    @Update("""
        UPDATE menus
        SET parent_id = #{parentId}, name = #{name}, path = #{path}, component = #{component}, permission_code = #{permissionCode},
            menu_key = #{menuKey}, menu_type = #{menuType}, icon = #{icon}, status = #{status}, visible = #{visible}, sort_order = #{sortOrder}
        WHERE id = #{id}
        """)
    int update(MenuNode menu);

    @Select("SELECT COUNT(*) FROM menus WHERE parent_id = #{id}")
    long countChildren(@Param("id") long id);

    @Delete("DELETE FROM role_menus WHERE menu_id = #{menuId}")
    int deleteRoleMenusByMenuId(@Param("menuId") long menuId);

    @Delete("DELETE FROM menus WHERE id = #{id}")
    int deleteById(@Param("id") long id);
}
