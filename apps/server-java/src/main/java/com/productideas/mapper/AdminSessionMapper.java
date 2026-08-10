package com.productideas.mapper;

import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface AdminSessionMapper {

    @Update("UPDATE admin_sessions SET is_current = 0 WHERE admin_user_id = #{adminUserId} AND status = '在线'")
    int clearCurrentSessions(@Param("adminUserId") long adminUserId);

    @Insert("""
        INSERT INTO admin_sessions (
          admin_user_id, session_token, device_type, device_name, browser, os, ip_address, is_current, status
        ) VALUES (#{adminUserId}, #{sessionToken}, #{deviceType}, #{deviceName}, #{browser}, #{os}, #{ipAddress}, 1, '在线')
        """)
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(AdminSessionRecord record);

    @Select("""
        SELECT id
        FROM admin_sessions
        WHERE id = #{sessionId} AND admin_user_id = #{adminUserId} AND status = '在线'
        LIMIT 1
        """)
    Long findActiveSession(@Param("sessionId") long sessionId, @Param("adminUserId") long adminUserId);

    @Update("UPDATE admin_sessions SET last_active_at = NOW() WHERE id = #{sessionId}")
    int touchSession(@Param("sessionId") long sessionId);

    @Update("""
        UPDATE admin_sessions
        SET status = '离线', is_current = 0, revoked_at = NOW()
        WHERE id = #{sessionId} AND admin_user_id = #{adminUserId}
        """)
    int revokeSession(@Param("sessionId") long sessionId, @Param("adminUserId") long adminUserId);

    @Select("""
        SELECT
          id,
          device_type AS deviceType,
          device_name AS deviceName,
          browser,
          os,
          ip_address AS ipAddress,
          is_current AS isCurrent,
          status,
          last_active_at AS lastActiveAt,
          created_at AS createdAt
        FROM admin_sessions
        WHERE admin_user_id = #{adminUserId}
        ORDER BY is_current DESC, last_active_at DESC, id DESC
        """)
    java.util.List<com.productideas.domain.AdminSessionDevice> listDevicesByAdminUserId(@Param("adminUserId") long adminUserId);

    @Update("""
        UPDATE admin_sessions
        SET status = '离线', is_current = 0, revoked_at = NOW()
        WHERE id = #{sessionId} AND admin_user_id = #{adminUserId} AND status = '在线'
        """)
    int revokeOnlineDevice(@Param("sessionId") long sessionId, @Param("adminUserId") long adminUserId);

    class AdminSessionRecord {
        private Long id;
        private long adminUserId;
        private String sessionToken;
        private String deviceType;
        private String deviceName;
        private String browser;
        private String os;
        private String ipAddress;

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public long getAdminUserId() {
            return adminUserId;
        }

        public void setAdminUserId(long adminUserId) {
            this.adminUserId = adminUserId;
        }

        public String getSessionToken() {
            return sessionToken;
        }

        public void setSessionToken(String sessionToken) {
            this.sessionToken = sessionToken;
        }

        public String getDeviceType() {
            return deviceType;
        }

        public void setDeviceType(String deviceType) {
            this.deviceType = deviceType;
        }

        public String getDeviceName() {
            return deviceName;
        }

        public void setDeviceName(String deviceName) {
            this.deviceName = deviceName;
        }

        public String getBrowser() {
            return browser;
        }

        public void setBrowser(String browser) {
            this.browser = browser;
        }

        public String getOs() {
            return os;
        }

        public void setOs(String os) {
            this.os = os;
        }

        public String getIpAddress() {
            return ipAddress;
        }

        public void setIpAddress(String ipAddress) {
            this.ipAddress = ipAddress;
        }
    }
}
