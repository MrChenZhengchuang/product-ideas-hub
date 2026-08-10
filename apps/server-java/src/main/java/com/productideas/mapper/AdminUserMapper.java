package com.productideas.mapper;

import com.productideas.domain.AdminUser;
import com.productideas.domain.AdminUserRoleRow;
import com.productideas.domain.ProfileView;
import com.productideas.domain.RoleItem;
import com.productideas.domain.SystemUserItem;
import java.util.List;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface AdminUserMapper {

    @Select("""
        SELECT
          au.id,
          au.name,
          au.account,
          au.phone,
          au.email,
          au.avatar,
          au.role_id AS roleId,
          au.department_id AS departmentId,
          d.name AS departmentName,
          au.status,
          au.password
        FROM admin_users au
        LEFT JOIN departments d ON d.id = au.department_id
        WHERE au.account = #{account}
        LIMIT 1
        """)
    AdminUser findByAccount(@Param("account") String account);

    @Select("""
        SELECT
          au.id,
          au.name,
          au.account,
          au.phone,
          au.email,
          au.avatar,
          au.role_id AS roleId,
          au.department_id AS departmentId,
          d.name AS departmentName,
          au.status
        FROM admin_users au
        LEFT JOIN departments d ON d.id = au.department_id
        WHERE au.id = #{id}
        LIMIT 1
        """)
    AdminUser findDetailById(@Param("id") long id);

    @Select("""
        SELECT r.id, r.name
        FROM admin_user_roles aur
        INNER JOIN roles r ON r.id = aur.role_id
        WHERE aur.admin_user_id = #{adminUserId}
        ORDER BY r.id ASC
        """)
    List<RoleItem> listRolesByAdminUserId(@Param("adminUserId") long adminUserId);

    @Select("SELECT id, name FROM roles WHERE id = #{roleId} LIMIT 1")
    RoleItem findRoleById(@Param("roleId") long roleId);

    @Update("UPDATE admin_users SET password = #{password} WHERE id = #{id}")
    int updatePassword(@Param("id") long id, @Param("password") String password);

    @Select("""
        SELECT
          au.id,
          au.name,
          au.account,
          au.phone,
          au.email,
          au.avatar,
          au.status,
          au.created_at AS createdAt,
          d.name AS departmentName
        FROM admin_users au
        LEFT JOIN departments d ON d.id = au.department_id
        WHERE au.id = #{id}
        LIMIT 1
        """)
    ProfileView findProfileById(@Param("id") long id);

    @Update("UPDATE admin_users SET name = #{name}, phone = #{phone}, email = #{email}, avatar = #{avatar} WHERE id = #{id}")
    int updateProfile(
        @Param("id") long id,
        @Param("name") String name,
        @Param("phone") String phone,
        @Param("email") String email,
        @Param("avatar") String avatar
    );

    @Select("SELECT password FROM admin_users WHERE id = #{id} LIMIT 1")
    String findPasswordById(@Param("id") long id);

    long countSystemUsers(@Param("keyword") String keyword, @Param("status") String status);

    List<SystemUserItem> listSystemUsers(
        @Param("keyword") String keyword,
        @Param("status") String status,
        @Param("limit") int limit,
        @Param("offset") int offset
    );

    List<AdminUserRoleRow> listUserRolesByUserIds(@Param("userIds") List<Long> userIds);

    @Insert("""
        INSERT INTO admin_users (name, account, password, role_id, department_id, status)
        VALUES (#{name}, #{account}, #{password}, #{roleId}, #{departmentId}, #{status})
        """)
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insertSystemUser(AdminUser user);

    @Update("""
        UPDATE admin_users
        SET name = #{name}, account = #{account}, role_id = #{roleId}, department_id = #{departmentId}, status = #{status}
        WHERE id = #{id}
        """)
    int updateSystemUser(AdminUser user);

    @Update("UPDATE admin_users SET status = #{status} WHERE id = #{id}")
    int updateStatus(@Param("id") long id, @Param("status") String status);

    @Delete("DELETE FROM admin_user_roles WHERE admin_user_id = #{adminUserId}")
    int deleteUserRoles(@Param("adminUserId") long adminUserId);

    @Insert("INSERT INTO admin_user_roles (admin_user_id, role_id) VALUES (#{adminUserId}, #{roleId})")
    int insertUserRole(@Param("adminUserId") long adminUserId, @Param("roleId") long roleId);

    @Delete("DELETE FROM admin_users WHERE id = #{id}")
    int deleteById(@Param("id") long id);
}
