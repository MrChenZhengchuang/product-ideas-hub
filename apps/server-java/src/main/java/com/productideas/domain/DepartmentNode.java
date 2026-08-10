package com.productideas.domain;

import java.util.ArrayList;
import java.util.List;

public class DepartmentNode {

    private Long id;
    private Long parentId;
    private String name;
    private String phone;
    private String email;
    private String status;
    private Integer sortOrder;
    private List<DepartmentLeaderItem> leaders = new ArrayList<>();
    private String leaderDisplay;
    private String primaryLeaderName;
    private List<DepartmentNode> children = new ArrayList<>();

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getParentId() {
        return parentId;
    }

    public void setParentId(Long parentId) {
        this.parentId = parentId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }

    public List<DepartmentLeaderItem> getLeaders() {
        return leaders;
    }

    public void setLeaders(List<DepartmentLeaderItem> leaders) {
        this.leaders = leaders;
    }

    public String getLeaderDisplay() {
        return leaderDisplay;
    }

    public void setLeaderDisplay(String leaderDisplay) {
        this.leaderDisplay = leaderDisplay;
    }

    public String getPrimaryLeaderName() {
        return primaryLeaderName;
    }

    public void setPrimaryLeaderName(String primaryLeaderName) {
        this.primaryLeaderName = primaryLeaderName;
    }

    public List<DepartmentNode> getChildren() {
        return children;
    }

    public void setChildren(List<DepartmentNode> children) {
        this.children = children;
    }
}
