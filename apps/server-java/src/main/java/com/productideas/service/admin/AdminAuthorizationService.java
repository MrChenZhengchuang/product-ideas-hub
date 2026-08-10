package com.productideas.service.admin;

import com.productideas.common.ApiException;
import com.productideas.domain.AuthorizationTreeNode;
import com.productideas.domain.MenuNode;
import com.productideas.domain.MenuPermissionRow;
import com.productideas.domain.PermissionAuthRow;
import com.productideas.domain.PermissionCodeItem;
import com.productideas.domain.PermissionGroupItem;
import com.productideas.domain.PermissionGroupRow;
import com.productideas.mapper.MenuMapper;
import com.productideas.mapper.PermissionMapper;
import com.productideas.util.PermissionLabelUtils;
import com.productideas.util.RequestUtils;
import com.productideas.util.TreeUtils;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminAuthorizationService {

    private final PermissionMapper permissionMapper;
    private final MenuMapper menuMapper;

    public AdminAuthorizationService(PermissionMapper permissionMapper, MenuMapper menuMapper) {
        this.permissionMapper = permissionMapper;
        this.menuMapper = menuMapper;
    }

    public List<PermissionGroupItem> listPermissionGroups() {
        List<PermissionGroupRow> groups = permissionMapper.listPermissionGroups();
        List<PermissionGroupRow> permissions = permissionMapper.listPermissionGroupItems();

        List<PermissionGroupItem> result = new ArrayList<>();
        for (PermissionGroupRow group : groups) {
            PermissionGroupItem item = new PermissionGroupItem();
            item.setKey(group.getKey());
            item.setName(group.getName());
            List<PermissionCodeItem> groupPermissions = permissions.stream()
                .filter(permission -> group.getKey().equals(permission.getGroupKey()))
                .map(permission -> {
                    PermissionCodeItem codeItem = new PermissionCodeItem();
                    codeItem.setId(permission.getId());
                    codeItem.setCode(permission.getPermissionCode());
                    return codeItem;
                })
                .toList();
            item.setPermissions(groupPermissions);
            result.add(item);
        }
        return result;
    }

    public List<AuthorizationTreeNode> getAuthorizationTree() {
        List<MenuNode> menuRows = menuMapper.listActiveMenus();
        List<PermissionAuthRow> permissionRows = permissionMapper.listAuthorizationPermissions();

        Set<Long> activeMenuIds = new HashSet<>();
        for (MenuNode menu : menuRows) {
            if (menu.getId() != null) {
                activeMenuIds.add(menu.getId());
            }
        }

        List<AuthorizationTreeNode> menuTree = new ArrayList<>(attachMenuTree(menuRows, permissionRows, activeMenuIds));
        menuTree.addAll(buildDetachedGroups(permissionRows, activeMenuIds));
        return menuTree;
    }

    public List<MenuNode> listMenus() {
        List<MenuNode> menuRows = menuMapper.listAllMenus();
        List<MenuPermissionRow> permissionRows = permissionMapper.listMenuPermissions();

        List<MenuNode> normalizedMenuRows = new ArrayList<>();
        for (MenuNode item : menuRows) {
            if ("button".equals(item.getMenuType()) && item.getPermissionCode() != null && !item.getPermissionCode().isEmpty()) {
                MenuNode copy = copyMenuNode(item);
                copy.setName(PermissionLabelUtils.getPermissionActionLabel(item.getPermissionCode()));
                normalizedMenuRows.add(copy);
            } else {
                normalizedMenuRows.add(copyMenuNode(item));
            }
        }

        Set<String> existingButtonCodes = new HashSet<>();
        for (MenuNode item : normalizedMenuRows) {
            if ("button".equals(item.getMenuType()) && item.getPermissionCode() != null && !item.getPermissionCode().isEmpty()) {
                existingButtonCodes.add(item.getPermissionCode());
            }
        }

        List<MenuNode> derivedButtonRows = new ArrayList<>();
        int index = 0;
        for (MenuPermissionRow permission : permissionRows) {
            if (existingButtonCodes.contains(permission.getPermissionCode())) {
                continue;
            }
            MenuNode button = new MenuNode();
            button.setId(-permission.getId());
            button.setParentId(permission.getMenuId());
            button.setName(PermissionLabelUtils.getPermissionActionLabel(permission.getPermissionCode()));
            button.setPath("");
            button.setComponent("");
            button.setPermissionCode(permission.getPermissionCode());
            button.setMenuKey("permission:" + permission.getPermissionCode());
            button.setMenuType("button");
            button.setIcon("");
            button.setStatus("启用");
            button.setVisible("隐藏");
            button.setSortOrder(1000 + index);
            button.setSourceType("permission");
            button.setGroupName(permission.getGroupName());
            derivedButtonRows.add(button);
            index++;
        }

        List<MenuNode> combined = new ArrayList<>(normalizedMenuRows.size() + derivedButtonRows.size());
        for (MenuNode item : normalizedMenuRows) {
            MenuNode copy = copyMenuNode(item);
            copy.setSourceType("menu");
            combined.add(copy);
        }
        combined.addAll(derivedButtonRows);
        return TreeUtils.buildMenuTree(combined);
    }

    public long createMenu(Map<String, Object> body) {
        String missingField = RequestUtils.requireBodyField(body, "name", "menuKey", "menuType", "status", "visible");
        if (missingField != null) {
            throw new ApiException(missingField + " 不能为空", 400);
        }
        MenuNode menu = buildMenu(body);
        menuMapper.insert(menu);
        return menu.getId();
    }

    public void updateMenu(long id, Map<String, Object> body) {
        String missingField = RequestUtils.requireBodyField(body, "name", "menuKey", "menuType", "status", "visible");
        if (missingField != null) {
            throw new ApiException(missingField + " 不能为空", 400);
        }
        MenuNode menu = buildMenu(body);
        menu.setId(id);
        menuMapper.update(menu);
    }

    @Transactional
    public void deleteMenu(long id) {
        if (menuMapper.countChildren(id) > 0) {
            throw new ApiException("请先删除下级菜单", 400);
        }
        menuMapper.deleteRoleMenusByMenuId(id);
        menuMapper.deleteById(id);
    }

    private List<AuthorizationTreeNode> attachMenuTree(
        List<MenuNode> menuRows,
        List<PermissionAuthRow> permissionRows,
        Set<Long> activeMenuIds
    ) {
        List<MenuNode> tree = TreeUtils.buildMenuTree(menuRows);
        return new ArrayList<>(tree.stream().map(menu -> toAuthorizationMenuNode(menu, permissionRows, activeMenuIds)).toList());
    }

    private AuthorizationTreeNode toAuthorizationMenuNode(
        MenuNode menu,
        List<PermissionAuthRow> permissionRows,
        Set<Long> activeMenuIds
    ) {
        AuthorizationTreeNode node = new AuthorizationTreeNode();
        node.setId(menu.getId());
        node.setKey("menu-" + menu.getId());
        node.setTitle(menu.getName() == null ? "" : menu.getName());
        node.setNodeType("menu");

        List<AuthorizationTreeNode> children = new ArrayList<>();
        List<MenuNode> menuChildren = menu.getChildren();
        if (menuChildren != null) {
            for (MenuNode child : menuChildren) {
                children.add(toAuthorizationMenuNode(child, permissionRows, activeMenuIds));
            }
        }
        if (menu.getId() != null) {
            for (PermissionAuthRow permission : permissionRows) {
                if (menu.getId().equals(permission.getMenuId())) {
                    children.add(toPermissionNode(permission));
                }
            }
        }
        node.setChildren(children);
        return node;
    }

    private AuthorizationTreeNode toPermissionNode(PermissionAuthRow permission) {
        AuthorizationTreeNode node = new AuthorizationTreeNode();
        node.setId(permission.getId());
        node.setKey("permission-" + permission.getId());
        node.setTitle(
            PermissionLabelUtils.formatPermissionTitle(
                permission.getGroupName() == null ? "未分组" : permission.getGroupName(),
                permission.getPermissionCode()
            )
        );
        node.setNodeType("permission");
        node.setPermissionCode(permission.getPermissionCode());
        node.setChildren(new ArrayList<>());
        return node;
    }

    private List<AuthorizationTreeNode> buildDetachedGroups(List<PermissionAuthRow> permissionRows, Set<Long> activeMenuIds) {
        Set<Long> assignedPermissionIds = new HashSet<>();
        for (PermissionAuthRow permission : permissionRows) {
            if (permission.getMenuId() != null && activeMenuIds.contains(permission.getMenuId())) {
                assignedPermissionIds.add(permission.getId());
            }
        }

        Map<String, AuthorizationTreeNode> detachedGroups = new LinkedHashMap<>();
        for (PermissionAuthRow permission : permissionRows) {
            if (permission.getId() != null && assignedPermissionIds.contains(permission.getId())) {
                continue;
            }
            String groupKey = permission.getGroupKey();
            if (groupKey == null || groupKey.isBlank()) {
                groupKey = "ungrouped";
            }
            String finalGroupKey = groupKey;
            AuthorizationTreeNode group = detachedGroups.computeIfAbsent(finalGroupKey, key -> {
                AuthorizationTreeNode node = new AuthorizationTreeNode();
                node.setId("group-" + finalGroupKey);
                node.setKey("group-" + finalGroupKey);
                node.setTitle(
                    permission.getGroupName() == null || permission.getGroupName().isBlank()
                        ? "未分组"
                        : permission.getGroupName()
                );
                node.setNodeType("group");
                node.setChildren(new ArrayList<>());
                return node;
            });
            group.getChildren().add(toPermissionNode(permission));
        }
        return new ArrayList<>(detachedGroups.values());
    }

    private static MenuNode buildMenu(Map<String, Object> body) {
        MenuNode menu = new MenuNode();
        Object parentId = body.get("parentId");
        menu.setParentId(parentId == null || String.valueOf(parentId).isEmpty() ? null : Long.parseLong(String.valueOf(parentId)));
        menu.setName(String.valueOf(body.get("name")));
        menu.setPath(body.get("path") == null ? "" : String.valueOf(body.get("path")));
        menu.setComponent(body.get("component") == null ? "" : String.valueOf(body.get("component")));
        menu.setPermissionCode(body.get("permissionCode") == null ? "" : String.valueOf(body.get("permissionCode")));
        menu.setMenuKey(String.valueOf(body.get("menuKey")));
        menu.setMenuType(String.valueOf(body.get("menuType")));
        menu.setIcon(body.get("icon") == null ? "" : String.valueOf(body.get("icon")));
        menu.setStatus(String.valueOf(body.get("status")));
        menu.setVisible(String.valueOf(body.get("visible")));
        menu.setSortOrder(body.get("sortOrder") instanceof Number number ? number.intValue() : 0);
        return menu;
    }

    private static MenuNode copyMenuNode(MenuNode source) {
        MenuNode copy = new MenuNode();
        copy.setId(source.getId());
        copy.setParentId(source.getParentId());
        copy.setName(source.getName());
        copy.setPath(source.getPath());
        copy.setComponent(source.getComponent());
        copy.setPermissionCode(source.getPermissionCode());
        copy.setMenuKey(source.getMenuKey());
        copy.setMenuType(source.getMenuType());
        copy.setIcon(source.getIcon());
        copy.setStatus(source.getStatus());
        copy.setVisible(source.getVisible());
        copy.setSortOrder(source.getSortOrder());
        copy.setSourceType(source.getSourceType());
        copy.setGroupName(source.getGroupName());
        return copy;
    }
}
