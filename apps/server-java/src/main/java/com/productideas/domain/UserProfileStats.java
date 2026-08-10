package com.productideas.domain;

public class UserProfileStats {

    private long publishedProjects;
    private long pendingProjects;
    private long totalFavorites;
    private long totalLikes;

    public long getPublishedProjects() {
        return publishedProjects;
    }

    public void setPublishedProjects(long publishedProjects) {
        this.publishedProjects = publishedProjects;
    }

    public long getPendingProjects() {
        return pendingProjects;
    }

    public void setPendingProjects(long pendingProjects) {
        this.pendingProjects = pendingProjects;
    }

    public long getTotalFavorites() {
        return totalFavorites;
    }

    public void setTotalFavorites(long totalFavorites) {
        this.totalFavorites = totalFavorites;
    }

    public long getTotalLikes() {
        return totalLikes;
    }

    public void setTotalLikes(long totalLikes) {
        this.totalLikes = totalLikes;
    }
}
