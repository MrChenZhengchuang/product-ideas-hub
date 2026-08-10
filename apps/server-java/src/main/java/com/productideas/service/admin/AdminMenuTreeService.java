package com.productideas.service.admin;

import com.productideas.domain.MenuParentRef;
import com.productideas.mapper.MenuMapper;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class AdminMenuTreeService {

    private final MenuMapper menuMapper;

    public AdminMenuTreeService(MenuMapper menuMapper) {
        this.menuMapper = menuMapper;
    }

    public List<Long> expandMenuIdsWithAncestors(List<Long> menuIds) {
        if (menuIds == null || menuIds.isEmpty()) {
            return List.of();
        }

        Map<Long, MenuParentRef> menuMap = menuMapper.listMenuParentRefs().stream()
            .collect(Collectors.toMap(MenuParentRef::getId, item -> item, (left, right) -> left));

        Set<Long> expandedIds = new HashSet<>(menuIds);
        for (Long menuId : menuIds) {
            MenuParentRef current = menuMap.get(menuId);
            while (current != null && current.getParentId() != null) {
                expandedIds.add(current.getParentId());
                current = menuMap.get(current.getParentId());
            }
        }

        return expandedIds.stream().sorted().toList();
    }
}
