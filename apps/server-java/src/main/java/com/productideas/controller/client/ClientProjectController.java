package com.productideas.controller.client;

import com.productideas.common.ApiResponse;
import com.productideas.domain.CategoryItem;
import com.productideas.domain.ProjectDetail;
import com.productideas.domain.ProjectFavoriteItem;
import com.productideas.domain.ProjectListItem;
import com.productideas.domain.ProjectMyItem;
import com.productideas.domain.SiteUser;
import com.productideas.security.AuthContextHelper;
import com.productideas.service.client.ClientProjectService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/client")
public class ClientProjectController {

    private final ClientProjectService clientProjectService;

    public ClientProjectController(ClientProjectService clientProjectService) {
        this.clientProjectService = clientProjectService;
    }

    @GetMapping("/categories")
    public ApiResponse<List<CategoryItem>> categories() {
        return ApiResponse.ok(clientProjectService.listCategories());
    }

    @GetMapping("/projects")
    public ApiResponse<List<ProjectListItem>> projects(
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) String category
    ) {
        return ApiResponse.ok(clientProjectService.listProjects(keyword, category));
    }

    @GetMapping("/users/me/projects")
    public ApiResponse<List<ProjectMyItem>> myProjects(HttpServletRequest request) {
        SiteUser user = AuthContextHelper.requireSiteUser(request);
        return ApiResponse.ok(clientProjectService.listMyProjects(user));
    }

    @GetMapping("/users/me/favorites")
    public ApiResponse<List<ProjectFavoriteItem>> myFavorites(HttpServletRequest request) {
        SiteUser user = AuthContextHelper.requireSiteUser(request);
        return ApiResponse.ok(clientProjectService.listFavoriteProjects(user));
    }

    @GetMapping("/projects/{id}")
    public ApiResponse<ProjectDetail> projectDetail(@PathVariable long id, HttpServletRequest request) {
        SiteUser user = AuthContextHelper.requireSiteUser(request);
        return ApiResponse.ok(clientProjectService.getProjectDetail(id, user));
    }

    @PostMapping("/projects/{id}/favorite")
    public ApiResponse<Void> favoriteProject(@PathVariable long id, HttpServletRequest request) {
        SiteUser user = AuthContextHelper.requireSiteUser(request);
        clientProjectService.favoriteProject(id, user);
        return ApiResponse.okMessage("已收藏");
    }

    @DeleteMapping("/projects/{id}/favorite")
    public ApiResponse<Void> unfavoriteProject(@PathVariable long id, HttpServletRequest request) {
        SiteUser user = AuthContextHelper.requireSiteUser(request);
        clientProjectService.unfavoriteProject(id, user);
        return ApiResponse.okMessage("已取消收藏");
    }

    @PostMapping("/projects/{id}/like")
    public ApiResponse<Void> likeProject(@PathVariable long id, HttpServletRequest request) {
        SiteUser user = AuthContextHelper.requireSiteUser(request);
        clientProjectService.likeProject(id, user);
        return ApiResponse.okMessage("已点赞");
    }

    @DeleteMapping("/projects/{id}/like")
    public ApiResponse<Void> unlikeProject(@PathVariable long id, HttpServletRequest request) {
        SiteUser user = AuthContextHelper.requireSiteUser(request);
        clientProjectService.unlikeProject(id, user);
        return ApiResponse.okMessage("已取消点赞");
    }

    @PostMapping("/projects")
    public ApiResponse<Map<String, Object>> submitProject(
        HttpServletRequest request,
        @RequestBody SubmitProjectRequest body
    ) {
        SiteUser user = AuthContextHelper.requireSiteUser(request);
        Map<String, Object> payload = clientProjectService.submitProject(
            user,
            body.title(),
            body.summary(),
            body.details(),
            body.category()
        );
        return ApiResponse.ok(payload, "项目已提交审核");
    }

    public record SubmitProjectRequest(String title, String summary, String details, String category) {
    }
}
