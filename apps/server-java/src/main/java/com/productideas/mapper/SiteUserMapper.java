package com.productideas.mapper;

import com.productideas.domain.SiteUser;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface SiteUserMapper {

    @Select("""
        SELECT id, nickname, phone, password, member_level AS memberLevel, status
        FROM site_users
        WHERE id = #{id}
        LIMIT 1
        """)
    SiteUser findById(@Param("id") long id);

    @Select("""
        SELECT id, nickname, phone, password, member_level AS memberLevel, status
        FROM site_users
        WHERE phone = #{phone}
        LIMIT 1
        """)
    SiteUser findByPhone(@Param("phone") String phone);

    @Insert("""
        INSERT INTO site_users (nickname, phone, password, member_level, status)
        VALUES (#{nickname}, #{phone}, #{password}, #{memberLevel}, #{status})
        """)
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(SiteUser user);

    @Update("UPDATE site_users SET password = #{password} WHERE id = #{id}")
    int updatePassword(@Param("id") long id, @Param("password") String password);

    long countAdminUsers(@Param("keyword") String keyword, @Param("status") String status);

    java.util.List<com.productideas.domain.SiteUserAdminItem> listAdminUsers(
        @Param("keyword") String keyword,
        @Param("status") String status,
        @Param("limit") int limit,
        @Param("offset") int offset
    );

    @Insert("INSERT INTO site_users (nickname, phone, member_level, status) VALUES (#{nickname}, #{phone}, #{level}, #{status})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insertAdminUser(com.productideas.domain.SiteUserAdminItem user);

    @Update("UPDATE site_users SET nickname = #{nickname}, phone = #{phone}, member_level = #{level}, status = #{status} WHERE id = #{id}")
    int updateAdminUser(com.productideas.domain.SiteUserAdminItem user);

    @Update("UPDATE site_users SET status = #{status} WHERE id = #{id}")
    int updateAdminStatus(@Param("id") long id, @Param("status") String status);

    @Delete("DELETE FROM site_users WHERE id = #{id}")
    int deleteById(@Param("id") long id);
}
