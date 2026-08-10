package com.productideas.service.admin;

import com.productideas.common.ApiException;
import com.productideas.common.PageQuery;
import com.productideas.common.PageResult;
import com.productideas.domain.AdminProjectItem;
import com.productideas.domain.AdminProjectRecord;
import com.productideas.domain.ProjectCategoryAdmin;
import com.productideas.mapper.ProjectMapper;
import com.productideas.util.RequestUtils;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminProjectService {

    private final ProjectMapper projectMapper;

    public AdminProjectService(ProjectMapper projectMapper) {
        this.projectMapper = projectMapper;
    }

    public List<ProjectCategoryAdmin> listCategories() {
        return projectMapper.listAdminCategories();
    }

    public PageResult<AdminProjectItem> list(
        String keyword,
        String category,
        String status,
        String auditStatus,
        PageQuery pageQuery
    ) {
        String normalizedKeyword = keyword == null ? "" : keyword.trim();
        String normalizedCategory = category == null ? "" : category.trim();
        String normalizedStatus = status == null ? "" : status.trim();
        String normalizedAuditStatus = auditStatus == null ? "" : auditStatus.trim();
        long total = projectMapper.countAdminProjects(
            normalizedKeyword,
            normalizedCategory,
            normalizedStatus,
            normalizedAuditStatus
        );
        List<AdminProjectItem> rows = projectMapper.listAdminProjects(
            normalizedKeyword,
            normalizedCategory,
            normalizedStatus,
            normalizedAuditStatus,
            pageQuery.getLimit(),
            pageQuery.getOffset()
        );
        return PageResult.of(rows, total, pageQuery);
    }

    @Transactional
    public long create(Map<String, Object> body, long adminId) {
        String missingField = RequestUtils.requireBodyField(body, "title", "categoryId", "image", "status");
        if (missingField != null) {
            throw new ApiException(missingField + " 不能为空", 400);
        }

        AdminProjectRecord record = buildRecord(body, adminId, true);
        projectMapper.insertAdminProject(record);
        projectMapper.insertAuditLog(
            record.getId(),
            "approved".equals(record.getAuditStatus()) ? "approve" : "submit",
            "",
            record.getAuditStatus(),
            record.getAuditComment(),
            adminId
        );
        return record.getId();
    }

    public void update(long id, Map<String, Object> body, long adminId) {
        String missingField = RequestUtils.requireBodyField(body, "title", "categoryId", "image", "status");
        if (missingField != null) {
            throw new ApiException(missingField + " 不能为空", 400);
        }

        String currentAuditStatus = projectMapper.findAuditStatusById(id);
        if (currentAuditStatus == null) {
            throw new ApiException("项目不存在", 404);
        }

        AdminProjectRecord record = buildRecord(body, adminId, false);
        record.setId(id);
        if (!"published".equals(record.getStatus())) {
            record.setAuditStatus(body.get("auditStatus") == null ? currentAuditStatus : String.valueOf(body.get("auditStatus")));
        }
        projectMapper.updateAdminProject(record);
    }

    public void updateStatus(long id, Map<String, Object> body) {
        if (body == null || body.get("status") == null || String.valueOf(body.get("status")).isEmpty()) {
            throw new ApiException("status 不能为空", 400);
        }
        projectMapper.updateProjectStatus(id, String.valueOf(body.get("status")));
    }

    @Transactional
    public String audit(long id, Map<String, Object> body, long adminId) {
        String action = body == null ? null : String.valueOf(body.get("action"));
        if (!"approve".equals(action) && !"reject".equals(action)) {
            throw new ApiException("无效的审核动作", 400);
        }

        String currentAuditStatus = projectMapper.findAuditStatusById(id);
        if (currentAuditStatus == null) {
            throw new ApiException("项目不存在", 404);
        }

        String nextAuditStatus = "approve".equals(action) ? "approved" : "rejected";
        String nextStatus = "approve".equals(action) ? "published" : "draft";
        String comment = body.get("comment") == null ? "" : String.valueOf(body.get("comment"));
        LocalDateTime now = LocalDateTime.now();

        AdminProjectRecord record = new AdminProjectRecord();
        record.setId(id);
        record.setAuditStatus(nextAuditStatus);
        record.setAuditComment(comment);
        record.setStatus(nextStatus);
        record.setAuditedBy(adminId);
        record.setAuditedAt(now);
        record.setPublishedAt("approve".equals(action) ? now : null);
        projectMapper.auditProject(record);

        projectMapper.insertAuditLog(id, action, currentAuditStatus, nextAuditStatus, comment, adminId);
        return "approve".equals(action) ? "审核通过成功" : "审核驳回成功";
    }

    public void delete(long id) {
        projectMapper.deleteProjectById(id);
    }

    private AdminProjectRecord buildRecord(Map<String, Object> body, long adminId, boolean creating) {
        AdminProjectRecord record = new AdminProjectRecord();
        record.setTitle(String.valueOf(body.get("title")));
        String description = body.get("description") == null ? "" : String.valueOf(body.get("description"));
        record.setDescription(description);
        record.setContent(body.get("content") == null ? "" : String.valueOf(body.get("content")));
        record.setCategoryId(toLong(body.get("categoryId")));
        record.setImage(String.valueOf(body.get("image")));
        record.setStatus(String.valueOf(body.get("status")));
        String nextAuditStatus = "published".equals(record.getStatus())
            ? "approved"
            : (body.get("auditStatus") == null ? "pending" : String.valueOf(body.get("auditStatus")));
        record.setAuditStatus(nextAuditStatus);
        record.setAuditComment(body.get("auditComment") == null ? "" : String.valueOf(body.get("auditComment")));
        record.setSortOrder(body.get("sortOrder") instanceof Number number ? number.intValue() : 0);
        LocalDateTime now = LocalDateTime.now();
        record.setAuditedBy("approved".equals(nextAuditStatus) ? adminId : null);
        record.setAuditedAt("approved".equals(nextAuditStatus) ? now : null);
        record.setPublishedAt("published".equals(record.getStatus()) && "approved".equals(nextAuditStatus) ? now : null);
        return record;
    }

    private static Long toLong(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        return Long.parseLong(String.valueOf(value));
    }
}
