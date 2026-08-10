package com.productideas.common;

public class PageQuery {

    public static final int DEFAULT_PAGE = 1;
    public static final int DEFAULT_PAGE_SIZE = 10;
    public static final int MAX_PAGE_SIZE = 100;

    private final int page;
    private final int pageSize;

    public PageQuery(int page, int pageSize) {
        this.page = Math.max(page, 1);
        this.pageSize = Math.min(Math.max(pageSize, 1), MAX_PAGE_SIZE);
    }

    public static PageQuery of(Integer page, Integer pageSize) {
        int resolvedPage = page == null || page < 1 ? DEFAULT_PAGE : page;
        int resolvedSize = pageSize == null || pageSize < 1 ? DEFAULT_PAGE_SIZE : pageSize;
        return new PageQuery(resolvedPage, resolvedSize);
    }

    public int getPage() {
        return page;
    }

    public int getPageSize() {
        return pageSize;
    }

    public int getOffset() {
        return (page - 1) * pageSize;
    }

    public int getLimit() {
        return pageSize;
    }
}
