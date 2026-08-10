package com.productideas.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface DashboardMapper {

    @Select("SELECT COUNT(*) FROM admin_users")
    long countAdminUsers();

    @Select("SELECT COUNT(*) FROM roles")
    long countRoles();

    @Select("SELECT COUNT(*) FROM site_users")
    long countSiteUsers();

    @Select("SELECT COUNT(*) FROM projects")
    long countProjects();
}
