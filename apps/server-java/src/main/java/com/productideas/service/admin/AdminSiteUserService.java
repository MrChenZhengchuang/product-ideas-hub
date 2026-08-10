package com.productideas.service.admin;

import com.productideas.common.ApiException;
import com.productideas.common.PageQuery;
import com.productideas.common.PageResult;
import com.productideas.domain.SiteUserAdminItem;
import com.productideas.mapper.SiteUserMapper;
import com.productideas.util.RequestUtils;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class AdminSiteUserService {

    private final SiteUserMapper siteUserMapper;

    public AdminSiteUserService(SiteUserMapper siteUserMapper) {
        this.siteUserMapper = siteUserMapper;
    }

    public PageResult<SiteUserAdminItem> list(String keyword, String status, PageQuery pageQuery) {
        String normalizedKeyword = keyword == null ? "" : keyword.trim();
        String normalizedStatus = status == null ? "" : status.trim();
        long total = siteUserMapper.countAdminUsers(normalizedKeyword, normalizedStatus);
        List<SiteUserAdminItem> rows = siteUserMapper.listAdminUsers(
            normalizedKeyword,
            normalizedStatus,
            pageQuery.getLimit(),
            pageQuery.getOffset()
        );
        return PageResult.of(rows, total, pageQuery);
    }

    public long create(Map<String, Object> body) {
        validateBody(body);
        SiteUserAdminItem user = buildUser(body);
        siteUserMapper.insertAdminUser(user);
        return user.getId();
    }

    public void update(long id, Map<String, Object> body) {
        validateBody(body);
        SiteUserAdminItem user = buildUser(body);
        user.setId(id);
        siteUserMapper.updateAdminUser(user);
    }

    public void updateStatus(long id, Map<String, Object> body) {
        if (body == null || body.get("status") == null || String.valueOf(body.get("status")).isEmpty()) {
            throw new ApiException("status 不能为空", 400);
        }
        String status = String.valueOf(body.get("status"));
        validateSiteUserStatus(status);
        siteUserMapper.updateAdminStatus(id, status);
    }

    public void delete(long id) {
        siteUserMapper.deleteById(id);
    }

    private static void validateBody(Map<String, Object> body) {
        String missingField = RequestUtils.requireBodyField(body, "nickname", "phone", "level", "status");
        if (missingField != null) {
            throw new ApiException(missingField + " 不能为空", 400);
        }
        validateSiteUserStatus(String.valueOf(body.get("status")));
    }

    private static void validateSiteUserStatus(String status) {
        if (!"正常".equals(status) && !"冻结".equals(status)) {
            throw new ApiException("网站用户状态仅支持 正常 或 冻结", 400);
        }
    }

    private static SiteUserAdminItem buildUser(Map<String, Object> body) {
        SiteUserAdminItem user = new SiteUserAdminItem();
        user.setNickname(String.valueOf(body.get("nickname")));
        user.setPhone(String.valueOf(body.get("phone")));
        user.setLevel(String.valueOf(body.get("level")));
        user.setStatus(String.valueOf(body.get("status")));
        return user;
    }
}
