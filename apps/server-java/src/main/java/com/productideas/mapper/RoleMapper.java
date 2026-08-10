package com.productideas.mapper;

import com.productideas.domain.RoleDetail;
import com.productideas.domain.RoleListItem;
import java.util.List;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface RoleMapper {

    @Select("SELECT COUNT(*) > 0 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'roles' AND column_name = 'status' LIMIT 1")
    boolean hasStatusColumn();

    long countRoles();

    List<RoleListItem> listRoles(
        @Param("hasStatus") boolean hasStatus,
        @Param("limit") int limit,
        @Param("offset") int offset
    );

    RoleDetail findById(@Param("id") long id, @Param("hasStatus") boolean hasStatus);

    @Select("SELECT permission_id FROM role_permissions WHERE role_id = #{roleId} ORDER BY permission_id ASC")
    List<Long> listPermissionIdsByRoleId(@Param("roleId") long roleId);

    @Select("SELECT menu_id FROM role_menus WHERE role_id = #{roleId} ORDER BY menu_id ASC")
    List<Long> listMenuIdsByRoleId(@Param("roleId") long roleId);

    @Insert("INSERT INTO roles (name, scope) VALUES (#{name}, #{scope})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insertBasic(RoleDetail role);

    @Insert("INSERT INTO roles (name, scope, status) VALUES (#{name}, #{scope}, #{status})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insertWithStatus(RoleDetail role);

    @Update("UPDATE roles SET name = #{name}, scope = #{scope} WHERE id = #{id}")
    int updateBasic(RoleDetail role);

    @Update("UPDATE roles SET name = #{name}, scope = #{scope}, status = #{status} WHERE id = #{id}")
    int updateWithStatus(RoleDetail role);

    @Update("UPDATE roles SET status = #{status} WHERE id = #{id}")
    int updateStatus(@Param("id") long id, @Param("status") String status);

    @Select("SELECT COUNT(*) FROM admin_user_roles WHERE role_id = #{roleId}")
    long countMembers(@Param("roleId") long roleId);

    @Delete("DELETE FROM role_permissions WHERE role_id = #{roleId}")
    int deleteRolePermissions(@Param("roleId") long roleId);

    @Insert("INSERT INTO role_permissions (role_id, permission_id) VALUES (#{roleId}, #{permissionId})")
    int insertRolePermission(@Param("roleId") long roleId, @Param("permissionId") long permissionId);

    @Delete("DELETE FROM role_menus WHERE role_id = #{roleId}")
    int deleteRoleMenus(@Param("roleId") long roleId);

    @Insert("INSERT INTO role_menus (role_id, menu_id) VALUES (#{roleId}, #{menuId})")
    int insertRoleMenu(@Param("roleId") long roleId, @Param("menuId") long menuId);

    @Delete("DELETE FROM roles WHERE id = #{id}")
    int deleteById(@Param("id") long id);
}
