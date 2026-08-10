package com.productideas.util;

import java.util.Map;

public final class PermissionLabelUtils {

    private static final Map<String, String> ACTION_MAP = Map.ofEntries(
        Map.entry("view", "列表"),
        Map.entry("create", "新增"),
        Map.entry("edit", "编辑"),
        Map.entry("delete", "删除"),
        Map.entry("assign", "授权"),
        Map.entry("publish", "发布"),
        Map.entry("freeze", "冻结"),
        Map.entry("tag", "标签"),
        Map.entry("audit", "审核")
    );

    private PermissionLabelUtils() {
    }

    public static String getPermissionActionLabel(String permissionCode) {
        String actionKey = permissionCode == null || !permissionCode.contains(".")
            ? ""
            : permissionCode.substring(permissionCode.lastIndexOf('.') + 1);
        return ACTION_MAP.getOrDefault(actionKey, permissionCode == null ? "" : permissionCode);
    }

    public static String formatPermissionTitle(String groupName, String permissionCode) {
        return groupName + " / " + getPermissionActionLabel(permissionCode);
    }
}
