package com.productideas.domain;

import java.util.ArrayList;
import java.util.List;

public class AuthorizationTreeNode {

    private Object id;
    private String key;
    private String title;
    private String nodeType;
    private String permissionCode;
    private List<AuthorizationTreeNode> children = new ArrayList<>();

    public Object getId() {
        return id;
    }

    public void setId(Object id) {
        this.id = id;
    }

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getNodeType() {
        return nodeType;
    }

    public void setNodeType(String nodeType) {
        this.nodeType = nodeType;
    }

    public String getPermissionCode() {
        return permissionCode;
    }

    public void setPermissionCode(String permissionCode) {
        this.permissionCode = permissionCode;
    }

    public List<AuthorizationTreeNode> getChildren() {
        return children;
    }

    public void setChildren(List<AuthorizationTreeNode> children) {
        this.children = children;
    }
}
