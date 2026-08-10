package com.productideas.service.admin;

import com.productideas.common.ApiException;
import com.productideas.common.PageQuery;
import com.productideas.common.PageResult;
import com.productideas.domain.DictItemNode;
import com.productideas.domain.DictTypeItem;
import com.productideas.mapper.DictMapper;
import com.productideas.util.RequestUtils;
import com.productideas.util.TreeUtils;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class AdminDictService {

    private final DictMapper dictMapper;

    public AdminDictService(DictMapper dictMapper) {
        this.dictMapper = dictMapper;
    }

    public PageResult<DictTypeItem> listTypes(String keyword, String status, PageQuery pageQuery) {
        String normalizedKeyword = keyword == null ? "" : keyword.trim();
        String normalizedStatus = status == null ? "" : status.trim();
        long total = dictMapper.countDictTypes(normalizedKeyword, normalizedStatus);
        List<DictTypeItem> rows = dictMapper.listDictTypes(
            normalizedKeyword,
            normalizedStatus,
            pageQuery.getLimit(),
            pageQuery.getOffset()
        );
        return PageResult.of(rows, total, pageQuery);
    }

    public long createType(Map<String, Object> body) {
        String missingField = RequestUtils.requireBodyField(body, "name", "code", "valueType", "status");
        if (missingField != null) {
            throw new ApiException(missingField + " 不能为空", 400);
        }

        DictTypeItem item = buildDictType(body);
        dictMapper.insertDictType(item);
        return item.getId();
    }

    public void updateType(long id, Map<String, Object> body) {
        String missingField = RequestUtils.requireBodyField(body, "name", "code", "valueType", "status");
        if (missingField != null) {
            throw new ApiException(missingField + " 不能为空", 400);
        }

        DictTypeItem item = buildDictType(body);
        item.setId(id);
        dictMapper.updateDictType(item);
    }

    public void deleteType(long id) {
        if (dictMapper.countItemsByDictTypeId(id) > 0) {
            throw new ApiException("该字典下仍有字典项，无法删除", 400);
        }
        dictMapper.deleteDictType(id);
    }

    public PageResult<DictItemNode> listItems(
        long dictTypeId,
        String keyword,
        String status,
        String viewMode,
        PageQuery pageQuery
    ) {
        String normalizedKeyword = keyword == null ? "" : keyword.trim();
        String normalizedStatus = status == null ? "" : status.trim();

        List<DictItemNode> rows = dictMapper.listDictItemsFiltered(
            dictTypeId,
            normalizedKeyword,
            normalizedStatus,
            null,
            null
        );
        List<DictItemNode> tree = TreeUtils.buildDictItemTree(rows);

        if ("flat".equals(viewMode)) {
            long total = rows.size();
            int from = pageQuery.getOffset();
            if (from >= rows.size()) {
                return PageResult.of(List.of(), total, pageQuery);
            }
            int to = Math.min(from + pageQuery.getLimit(), rows.size());
            return PageResult.of(rows.subList(from, to), total, pageQuery);
        }

        long total = tree.size();
        int from = pageQuery.getOffset();
        if (from >= tree.size()) {
            return PageResult.of(List.of(), total, pageQuery);
        }
        int to = Math.min(from + pageQuery.getLimit(), tree.size());
        return PageResult.of(new ArrayList<>(tree.subList(from, to)), total, pageQuery);
    }

    public long createItem(Map<String, Object> body) {
        String missingField = RequestUtils.requireBodyField(body, "dictTypeId", "label", "value", "status");
        if (missingField != null) {
            throw new ApiException(missingField + " 不能为空", 400);
        }

        DictItemNode item = buildDictItem(body);
        dictMapper.insertDictItem(item);
        return item.getId();
    }

    public void updateItem(long id, Map<String, Object> body) {
        String missingField = RequestUtils.requireBodyField(body, "dictTypeId", "label", "value", "status");
        if (missingField != null) {
            throw new ApiException(missingField + " 不能为空", 400);
        }

        DictItemNode item = buildDictItem(body);
        item.setId(id);
        dictMapper.updateDictItem(item);
    }

    public void deleteItem(long id) {
        if (dictMapper.countChildDictItems(id) > 0) {
            throw new ApiException("请先删除下级字典项", 400);
        }
        dictMapper.deleteDictItem(id);
    }

    private static DictTypeItem buildDictType(Map<String, Object> body) {
        DictTypeItem item = new DictTypeItem();
        item.setName(String.valueOf(body.get("name")));
        item.setCode(String.valueOf(body.get("code")));
        item.setValueType(String.valueOf(body.get("valueType")));
        item.setStatus(String.valueOf(body.get("status")));
        item.setSortOrder(body.get("sortOrder") instanceof Number number ? number.intValue() : 0);
        item.setRemark(body.get("remark") == null ? "" : String.valueOf(body.get("remark")));
        return item;
    }

    private static DictItemNode buildDictItem(Map<String, Object> body) {
        DictItemNode item = new DictItemNode();
        item.setDictTypeId(toLong(body.get("dictTypeId")));
        Object parentId = body.get("parentId");
        item.setParentId(parentId == null || String.valueOf(parentId).isEmpty() ? null : toLong(parentId));
        item.setLabel(String.valueOf(body.get("label")));
        item.setValue(String.valueOf(body.get("value")));
        item.setStatus(String.valueOf(body.get("status")));
        item.setSortOrder(body.get("sortOrder") instanceof Number number ? number.intValue() : 0);
        item.setRemark(body.get("remark") == null ? "" : String.valueOf(body.get("remark")));
        return item;
    }

    private static Long toLong(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        return Long.parseLong(String.valueOf(value));
    }
}
