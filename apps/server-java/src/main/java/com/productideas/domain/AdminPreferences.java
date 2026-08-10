package com.productideas.domain;

public class AdminPreferences {

    private String colorPrimary;
    private boolean showPageTabs;
    private boolean compactContent;

    public String getColorPrimary() {
        return colorPrimary;
    }

    public void setColorPrimary(String colorPrimary) {
        this.colorPrimary = colorPrimary;
    }

    public boolean isShowPageTabs() {
        return showPageTabs;
    }

    public void setShowPageTabs(boolean showPageTabs) {
        this.showPageTabs = showPageTabs;
    }

    public boolean isCompactContent() {
        return compactContent;
    }

    public void setCompactContent(boolean compactContent) {
        this.compactContent = compactContent;
    }
}
