package com.productideas.domain;

public class UserProfile {

    private Long id;
    private String nickname;
    private String phone;
    private String memberLevel;
    private String status;
    private UserProfileStats stats;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNickname() {
        return nickname;
    }

    public void setNickname(String nickname) {
        this.nickname = nickname;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getMemberLevel() {
        return memberLevel;
    }

    public void setMemberLevel(String memberLevel) {
        this.memberLevel = memberLevel;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public UserProfileStats getStats() {
        return stats;
    }

    public void setStats(UserProfileStats stats) {
        this.stats = stats;
    }
}
