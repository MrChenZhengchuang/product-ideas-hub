package com.productideas.domain;

public class DepartmentLeaderItem {

    private Long adminUserId;
    private String name;
    private String phone;
    private String email;
    private boolean primaryLeader;

    public Long getAdminUserId() {
        return adminUserId;
    }

    public void setAdminUserId(Long adminUserId) {
        this.adminUserId = adminUserId;
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

    public boolean isPrimaryLeader() {
        return primaryLeader;
    }

    public void setPrimaryLeader(boolean primaryLeader) {
        this.primaryLeader = primaryLeader;
    }
}
