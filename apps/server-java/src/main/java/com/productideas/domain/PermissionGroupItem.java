package com.productideas.domain;

import java.util.ArrayList;
import java.util.List;

public class PermissionGroupItem {

    private String key;
    private String name;
    private List<PermissionCodeItem> permissions = new ArrayList<>();

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public List<PermissionCodeItem> getPermissions() {
        return permissions;
    }

    public void setPermissions(List<PermissionCodeItem> permissions) {
        this.permissions = permissions;
    }
}
