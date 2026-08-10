package com.productideas.mapper;

import com.productideas.domain.DepartmentLeaderRow;
import com.productideas.domain.DepartmentNode;
import com.productideas.domain.DepartmentUserOption;
import java.util.List;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface DepartmentMapper {

    @Select("""
        SELECT id, parent_id AS parentId, name, phone, email, status, sort_order AS sortOrder
        FROM departments
        ORDER BY sort_order ASC, id ASC
        """)
    List<DepartmentNode> listAll();

    @Select("""
        SELECT
          dl.department_id AS departmentId,
          dl.admin_user_id AS adminUserId,
          dl.is_primary AS primaryLeader,
          dl.phone,
          dl.email,
          au.name
        FROM department_leaders dl
        INNER JOIN admin_users au ON au.id = dl.admin_user_id
        ORDER BY dl.department_id ASC, dl.is_primary DESC, dl.id ASC
        """)
    List<DepartmentLeaderRow> listAllLeaders();

    @Insert("""
        INSERT INTO departments (parent_id, name, phone, email, status, sort_order)
        VALUES (#{parentId}, #{name}, #{phone}, #{email}, #{status}, #{sortOrder})
        """)
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(DepartmentNode department);

    @Update("""
        UPDATE departments
        SET parent_id = #{parentId}, name = #{name}, phone = #{phone}, email = #{email}, status = #{status}, sort_order = #{sortOrder}
        WHERE id = #{id}
        """)
    int update(DepartmentNode department);

    @Select("SELECT COUNT(*) FROM departments WHERE parent_id = #{id}")
    long countChildren(@Param("id") long id);

    @Select("SELECT COUNT(*) FROM admin_users WHERE department_id = #{id}")
    long countMembers(@Param("id") long id);

    @Delete("DELETE FROM department_leaders WHERE department_id = #{departmentId}")
    int deleteLeaders(@Param("departmentId") long departmentId);

    @Insert("INSERT INTO department_leaders (department_id, admin_user_id, is_primary, phone, email) VALUES (#{departmentId}, #{adminUserId}, #{isPrimary}, #{phone}, #{email})")
    int insertLeader(
        @Param("departmentId") long departmentId,
        @Param("adminUserId") long adminUserId,
        @Param("isPrimary") boolean isPrimary,
        @Param("phone") String phone,
        @Param("email") String email
    );

    @Delete("DELETE FROM departments WHERE id = #{id}")
    int deleteById(@Param("id") long id);

    @Select("""
        SELECT id, name, account, department_id AS departmentId, status
        FROM admin_users
        WHERE status = '启用'
        ORDER BY id ASC
        """)
    List<DepartmentUserOption> listDepartmentUserOptions();
}
