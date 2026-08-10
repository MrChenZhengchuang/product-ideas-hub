package com.productideas.domain;

import java.time.LocalDateTime;

public class ProjectFavoriteItem extends ProjectMyItem {

    private LocalDateTime favoritedAt;
    private String authorName;

    public LocalDateTime getFavoritedAt() {
        return favoritedAt;
    }

    public void setFavoritedAt(LocalDateTime favoritedAt) {
        this.favoritedAt = favoritedAt;
    }

    public String getAuthorName() {
        return authorName;
    }

    public void setAuthorName(String authorName) {
        this.authorName = authorName;
    }
}
