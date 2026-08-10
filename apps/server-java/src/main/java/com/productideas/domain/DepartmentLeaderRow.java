package com.productideas.domain;

public class DepartmentLeaderRow {

    private Long departmentId;
    private Long adminUserId;
    private boolean primaryLeader;
    private String phone;
    private String email;
    private String name;

    public Long getDepartmentId() {
        return departmentId;
    }

    public void setDepartmentId(Long departmentId) {
        this.departmentId = departmentId;
    }

    public Long getAdminUserId() {
        return adminUserId;
    }

    public void setAdminUserId(Long adminUserId) {
        this.adminUserId = adminUserId;
    }

    public boolean isPrimaryLeader() {
        return primaryLeader;
    }

    public void setPrimaryLeader(boolean primaryLeader) {
        this.primaryLeader = primaryLeader;
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

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
