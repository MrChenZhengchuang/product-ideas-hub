package com.productideas.service.client;

import com.productideas.common.ApiException;
import com.productideas.domain.CategoryItem;
import com.productideas.domain.ProjectDetail;
import com.productideas.domain.ProjectDraftInsert;
import com.productideas.domain.ProjectFavoriteItem;
import com.productideas.domain.ProjectListItem;
import com.productideas.domain.ProjectMyItem;
import com.productideas.domain.SiteUser;
import com.productideas.mapper.ProjectMapper;
import com.productideas.util.ProjectFallbackImages;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ClientProjectService {

    private static final Logger log = LoggerFactory.getLogger(ClientProjectService.class);

    private final ProjectMapper projectMapper;

    public ClientProjectService(ProjectMapper projectMapper) {
        this.projectMapper = projectMapper;
    }

    public List<CategoryItem> listCategories() {
        List<CategoryItem> categories = new ArrayList<>();
        categories.add(new CategoryItem("all", "全部项目"));
        categories.addAll(projectMapper.listCategories());
        return categories;
    }

    public List<ProjectListItem> listProjects(String keyword, String category) {
        String normalizedKeyword = keyword == null ? "" : keyword.trim();
        String normalizedCategory = category == null ? "" : category.trim();
        return projectMapper.listPublishedProjects(
            normalizedKeyword.isEmpty() ? null : normalizedKeyword,
            normalizedCategory.isEmpty() ? null : normalizedCategory
        );
    }

    public List<ProjectMyItem> listMyProjects(SiteUser user) {
        return projectMapper.listMyProjects(user.getId());
    }

    public List<ProjectFavoriteItem> listFavoriteProjects(SiteUser user) {
        return projectMapper.listFavoriteProjects(user.getId());
    }

    public ProjectDetail getProjectDetail(long projectId, SiteUser user) {
        ProjectDetail project = projectMapper.findById(projectId);
        if (project == null) {
            throw new ApiException("项目不存在", 404);
        }

        boolean isOwner = project.getCreatorUserId() != null
            && project.getCreatorUserId().longValue() == user.getId().longValue();
        boolean canView = "published".equals(project.getStatus()) && "approved".equals(project.getAuditStatus());

        if (!canView && !isOwner) {
            throw new ApiException("项目暂未公开", 403);
        }

        trackProjectView(projectId, user.getId());
        project.setIsOwner(isOwner);
        project.setIsFavorited(projectMapper.findFavoriteId(projectId, user.getId()) != null);
        project.setIsLiked(projectMapper.findLikeId(projectId, user.getId()) != null);
        return project;
    }

    @Transactional
    public void favoriteProject(long projectId, SiteUser user) {
        ProjectDetail project = requirePublishedProject(projectId, "项目暂不可收藏");
        projectMapper.insertFavorite(project.getId(), user.getId());
        projectMapper.recalcFavoriteCount(projectId);
    }

    @Transactional
    public void unfavoriteProject(long projectId, SiteUser user) {
        projectMapper.deleteFavorite(projectId, user.getId());
        projectMapper.recalcFavoriteCount(projectId);
    }

    @Transactional
    public void likeProject(long projectId, SiteUser user) {
        ProjectDetail project = requirePublishedProject(projectId, "项目暂不可点赞");
        projectMapper.insertLike(project.getId(), user.getId());
        projectMapper.recalcLikeCount(projectId);
    }

    @Transactional
    public void unlikeProject(long projectId, SiteUser user) {
        projectMapper.deleteLike(projectId, user.getId());
        projectMapper.recalcLikeCount(projectId);
    }

    @Transactional
    public Map<String, Object> submitProject(SiteUser user, String title, String summary, String details, String category) {
        if (title == null || title.isBlank() || summary == null || summary.isBlank() || category == null || category.isBlank()) {
            throw new ApiException("请至少填写标题、项目方向和一句话想法", 400);
        }

        Long categoryId = projectMapper.findCategoryIdByKey(category);
        if (categoryId == null) {
            throw new ApiException("项目方向不存在", 400);
        }

        ProjectDraftInsert draft = new ProjectDraftInsert();
        draft.setTitle(title);
        draft.setDescription(summary);
        draft.setSummary(summary);
        draft.setContent(details == null ? "" : details);
        draft.setCategoryId(categoryId);
        draft.setCoverImage(ProjectFallbackImages.resolve(category));
        draft.setCreatorUserId(user.getId());
        projectMapper.insertUserProject(draft);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", draft.getId());
        return result;
    }

    private ProjectDetail requirePublishedProject(long projectId, String unavailableMessage) {
        ProjectDetail project = projectMapper.findById(projectId);
        if (project == null
            || !"published".equals(project.getStatus())
            || !"approved".equals(project.getAuditStatus())) {
            throw new ApiException(unavailableMessage, 404);
        }
        return project;
    }

    private void trackProjectView(long projectId, long userId) {
        try {
            if (projectMapper.findRecentViewId(projectId, userId) != null) {
                return;
            }
            projectMapper.insertView(projectId, userId);
            projectMapper.incrementViewCount(projectId);
        } catch (DataAccessException exception) {
            log.debug("Ignored project view tracking failure for project {} user {}", projectId, userId, exception);
        }
    }
}
