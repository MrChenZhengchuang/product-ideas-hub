package com.productideas.util;

import com.productideas.domain.DepartmentNode;
import com.productideas.domain.DictItemNode;
import com.productideas.domain.MenuNode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.BiConsumer;
import java.util.function.Function;

public final class TreeUtils {

    private TreeUtils() {
    }

    public static List<DictItemNode> buildDictItemTree(List<DictItemNode> rows) {
        return buildTree(rows, DictItemNode::getId, DictItemNode::getParentId, DictItemNode::getSortOrder, DictItemNode::getChildren, DictItemNode::setChildren);
    }

    public static List<DepartmentNode> buildDepartmentTree(List<DepartmentNode> rows) {
        return buildTree(rows, DepartmentNode::getId, DepartmentNode::getParentId, DepartmentNode::getSortOrder, DepartmentNode::getChildren, DepartmentNode::setChildren);
    }

    public static <T> List<T> buildTree(
        List<T> rows,
        Function<T, Long> idGetter,
        Function<T, Long> parentIdGetter,
        Function<T, Integer> sortOrderGetter,
        Function<T, List<T>> childrenGetter,
        BiConsumer<T, List<T>> childrenSetter
    ) {
        Map<Long, T> nodeMap = new HashMap<>();
        List<T> roots = new ArrayList<>();

        for (T row : rows) {
            childrenSetter.accept(row, new ArrayList<>());
            nodeMap.put(idGetter.apply(row), row);
        }

        for (T node : nodeMap.values()) {
            Long parentId = parentIdGetter.apply(node);
            if (parentId == null || parentId == 0L) {
                roots.add(node);
                continue;
            }

            Long nodeId = idGetter.apply(node);
            T parent = nodeMap.get(parentId);
            if (parent != null && !parentId.equals(nodeId)) {
                List<T> children = new ArrayList<>(childrenGetter.apply(parent));
                children.add(node);
                childrenSetter.accept(parent, children);
            } else {
                roots.add(node);
            }
        }

        return sortTreeNodes(roots, sortOrderGetter, idGetter, childrenGetter, childrenSetter);
    }

    private static <T> List<T> sortTreeNodes(
        List<T> nodes,
        Function<T, Integer> sortOrderGetter,
        Function<T, Long> idGetter,
        Function<T, List<T>> childrenGetter,
        BiConsumer<T, List<T>> childrenSetter
    ) {
        nodes.sort(Comparator.comparing(sortOrderGetter, Comparator.nullsLast(Integer::compareTo))
            .thenComparing(idGetter, Comparator.nullsLast(Long::compareTo)));

        for (T node : nodes) {
            List<T> children = childrenGetter.apply(node);
            if (children != null && !children.isEmpty()) {
                childrenSetter.accept(node, sortTreeNodes(children, sortOrderGetter, idGetter, childrenGetter, childrenSetter));
            }
        }

        return nodes;
    }

    public static List<MenuNode> buildMenuTree(List<MenuNode> rows) {
        return buildTree(rows, MenuNode::getId, MenuNode::getParentId, MenuNode::getSortOrder, MenuNode::getChildren, MenuNode::setChildren);
    }
}
