package com.productideas.mapper;

import com.productideas.domain.CategoryItem;
import com.productideas.domain.ProjectDraftInsert;
import com.productideas.domain.ProjectDetail;
import com.productideas.domain.ProjectFavoriteItem;
import com.productideas.domain.ProjectListItem;
import com.productideas.domain.ProjectMyItem;
import com.productideas.domain.UserProfileStats;
import java.util.List;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface ProjectMapper {

    List<CategoryItem> listCategories();

    List<ProjectListItem> listPublishedProjects(
        @Param("keyword") String keyword,
        @Param("category") String category
    );

    ProjectDetail findById(@Param("id") long id);

    UserProfileStats selectUserProjectStats(@Param("userId") long userId);

    List<ProjectMyItem> listMyProjects(@Param("userId") long userId);

    List<ProjectFavoriteItem> listFavoriteProjects(@Param("userId") long userId);

    Long findFavoriteId(@Param("projectId") long projectId, @Param("userId") long userId);

    Long findLikeId(@Param("projectId") long projectId, @Param("userId") long userId);

    int insertFavorite(@Param("projectId") long projectId, @Param("userId") long userId);

    int deleteFavorite(@Param("projectId") long projectId, @Param("userId") long userId);

    int recalcFavoriteCount(@Param("projectId") long projectId);

    int insertLike(@Param("projectId") long projectId, @Param("userId") long userId);

    int deleteLike(@Param("projectId") long projectId, @Param("userId") long userId);

    int recalcLikeCount(@Param("projectId") long projectId);

    Long findRecentViewId(@Param("projectId") long projectId, @Param("userId") long userId);

    int insertView(@Param("projectId") long projectId, @Param("userId") long userId);

    int incrementViewCount(@Param("projectId") long projectId);

    Long findCategoryIdByKey(@Param("categoryKey") String categoryKey);

    int insertUserProject(ProjectDraftInsert draft);

    List<com.productideas.domain.ProjectCategoryAdmin> listAdminCategories();

    long countAdminProjects(
        @Param("keyword") String keyword,
        @Param("category") String category,
        @Param("status") String status,
        @Param("auditStatus") String auditStatus
    );

    List<com.productideas.domain.AdminProjectItem> listAdminProjects(
        @Param("keyword") String keyword,
        @Param("category") String category,
        @Param("status") String status,
        @Param("auditStatus") String auditStatus,
        @Param("limit") int limit,
        @Param("offset") int offset
    );

    @Select("SELECT audit_status FROM projects WHERE id = #{id} LIMIT 1")
    String findAuditStatusById(@Param("id") long id);

    int insertAdminProject(com.productideas.domain.AdminProjectRecord record);

    int updateAdminProject(com.productideas.domain.AdminProjectRecord record);

    @Update("UPDATE projects SET status = #{status} WHERE id = #{id}")
    int updateProjectStatus(@Param("id") long id, @Param("status") String status);

    int auditProject(com.productideas.domain.AdminProjectRecord record);

    @Delete("DELETE FROM projects WHERE id = #{id}")
    int deleteProjectById(@Param("id") long id);

    int insertAuditLog(
        @Param("projectId") long projectId,
        @Param("action") String action,
        @Param("fromStatus") String fromStatus,
        @Param("toStatus") String toStatus,
        @Param("comment") String comment,
        @Param("operatorAdminId") Long operatorAdminId
    );
}
