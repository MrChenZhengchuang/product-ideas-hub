package com.productideas.common;

import java.util.List;

public class PageResult<T> {

    private List<T> list;
    private long total;
    private int page;
    private int pageSize;

    public PageResult() {
    }

    public PageResult(List<T> list, long total, PageQuery pageQuery) {
        this.list = list;
        this.total = total;
        this.page = pageQuery.getPage();
        this.pageSize = pageQuery.getPageSize();
    }

    public static <T> PageResult<T> of(List<T> list, long total, PageQuery pageQuery) {
        return new PageResult<>(list, total, pageQuery);
    }

    public List<T> getList() {
        return list;
    }

    public void setList(List<T> list) {
        this.list = list;
    }

    public long getTotal() {
        return total;
    }

    public void setTotal(long total) {
        this.total = total;
    }

    public int getPage() {
        return page;
    }

    public void setPage(int page) {
        this.page = page;
    }

    public int getPageSize() {
        return pageSize;
    }

    public void setPageSize(int pageSize) {
        this.pageSize = pageSize;
    }
}
