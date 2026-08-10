package com.productideas.mapper;

import com.productideas.domain.AdminIntegrationItem;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface AdminIntegrationMapper {

    @Select("""
        SELECT
          ai.id,
          ai.app_key AS appKey,
          ai.app_name AS appName,
          ai.app_type AS appType,
          ai.description,
          ai.status,
          ai.icon,
          aib.account_name AS accountName,
          aib.bound_at AS boundAt,
          CASE WHEN aib.id IS NULL THEN 0 ELSE 1 END AS bound
        FROM admin_integrations ai
        LEFT JOIN admin_integration_bindings aib
          ON aib.integration_id = ai.id AND aib.admin_user_id = #{adminUserId}
        ORDER BY ai.sort_order ASC, ai.id ASC
        """)
    java.util.List<AdminIntegrationItem> listByAdminUserId(@Param("adminUserId") long adminUserId);

    @Select("SELECT id, status FROM admin_integrations WHERE id = #{id} LIMIT 1")
    AdminIntegrationItem findById(@Param("id") long id);

    @Insert("""
        INSERT INTO admin_integration_bindings (admin_user_id, integration_id, account_name, status)
        VALUES (#{adminUserId}, #{integrationId}, #{accountName}, '已绑定')
        ON DUPLICATE KEY UPDATE
          account_name = VALUES(account_name),
          status = '已绑定',
          bound_at = CURRENT_TIMESTAMP
        """)
    int upsertBinding(
        @Param("adminUserId") long adminUserId,
        @Param("integrationId") long integrationId,
        @Param("accountName") String accountName
    );

    @Delete("DELETE FROM admin_integration_bindings WHERE admin_user_id = #{adminUserId} AND integration_id = #{integrationId}")
    int deleteBinding(@Param("adminUserId") long adminUserId, @Param("integrationId") long integrationId);
}
