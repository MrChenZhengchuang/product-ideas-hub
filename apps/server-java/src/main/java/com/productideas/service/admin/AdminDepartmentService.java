package com.productideas.service.admin;

import com.productideas.common.ApiException;
import com.productideas.domain.DepartmentLeaderItem;
import com.productideas.domain.DepartmentLeaderRow;
import com.productideas.domain.DepartmentNode;
import com.productideas.domain.DepartmentUserOption;
import com.productideas.mapper.DepartmentMapper;
import com.productideas.util.RequestUtils;
import com.productideas.util.TreeUtils;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminDepartmentService {

    private final DepartmentMapper departmentMapper;

    public AdminDepartmentService(DepartmentMapper departmentMapper) {
        this.departmentMapper = departmentMapper;
    }

    public List<DepartmentNode> list(String keyword) {
        List<DepartmentNode> rows = departmentMapper.listAll();
        List<DepartmentLeaderRow> leaderRows = departmentMapper.listAllLeaders();
        Map<Long, List<DepartmentLeaderItem>> leaderMap = new LinkedHashMap<>();

        for (DepartmentLeaderRow row : leaderRows) {
            DepartmentLeaderItem leader = new DepartmentLeaderItem();
            leader.setAdminUserId(row.getAdminUserId());
            leader.setName(row.getName());
            leader.setPhone(row.getPhone());
            leader.setEmail(row.getEmail());
            leader.setPrimaryLeader(row.isPrimaryLeader());
            leaderMap.computeIfAbsent(row.getDepartmentId(), key -> new ArrayList<>()).add(leader);
        }

        for (DepartmentNode item : rows) {
            List<DepartmentLeaderItem> leaders = leaderMap.getOrDefault(item.getId(), List.of());
            item.setLeaders(leaders);
            item.setLeaderDisplay(leaders.stream().map(DepartmentLeaderItem::getName).reduce((a, b) -> a + "、" + b).orElse(""));
            DepartmentLeaderItem primaryLeader = leaders.stream().filter(DepartmentLeaderItem::isPrimaryLeader).findFirst()
                .orElse(leaders.isEmpty() ? null : leaders.get(0));
            if (primaryLeader != null) {
                item.setPhone(primaryLeader.getPhone());
                item.setEmail(primaryLeader.getEmail());
                item.setPrimaryLeaderName(primaryLeader.getName());
            }
        }

        List<DepartmentNode> tree = TreeUtils.buildDepartmentTree(rows);
        String normalizedKeyword = keyword == null ? "" : keyword.trim();
        if (normalizedKeyword.isEmpty()) {
            return tree;
        }
        return filterDepartmentTree(tree, normalizedKeyword);
    }

    @Transactional
    public long create(Map<String, Object> body) {
        validateDepartmentBody(body);
        List<LeaderInput> leaders = normalizeLeaders(body.get("leaders"));
        LeaderInput primaryLeader = leaders.get(0);

        DepartmentNode department = new DepartmentNode();
        department.setParentId(parseNullableLong(body.get("parentId")));
        department.setName(String.valueOf(body.get("name")));
        department.setPhone(primaryLeader.phone());
        department.setEmail(primaryLeader.email());
        department.setStatus(String.valueOf(body.get("status")));
        department.setSortOrder(body.get("sortOrder") instanceof Number number ? number.intValue() : 0);
        departmentMapper.insert(department);
        syncLeaders(department.getId(), leaders);
        return department.getId();
    }

    @Transactional
    public void update(long id, Map<String, Object> body) {
        validateDepartmentBody(body);
        List<LeaderInput> leaders = normalizeLeaders(body.get("leaders"));
        LeaderInput primaryLeader = leaders.get(0);

        DepartmentNode department = new DepartmentNode();
        department.setId(id);
        department.setParentId(parseNullableLong(body.get("parentId")));
        department.setName(String.valueOf(body.get("name")));
        department.setPhone(primaryLeader.phone());
        department.setEmail(primaryLeader.email());
        department.setStatus(String.valueOf(body.get("status")));
        department.setSortOrder(body.get("sortOrder") instanceof Number number ? number.intValue() : 0);
        departmentMapper.update(department);
        syncLeaders(id, leaders);
    }

    @Transactional
    public void delete(long id) {
        if (departmentMapper.countChildren(id) > 0) {
            throw new ApiException("请先删除下级部门", 400);
        }
        if (departmentMapper.countMembers(id) > 0) {
            throw new ApiException("该部门下仍有关联系统用户", 400);
        }
        departmentMapper.deleteLeaders(id);
        departmentMapper.deleteById(id);
    }

    public List<DepartmentUserOption> listUserOptions() {
        return departmentMapper.listDepartmentUserOptions();
    }

    private void validateDepartmentBody(Map<String, Object> body) {
        String missingField = RequestUtils.requireBodyField(body, "name", "status");
        List<LeaderInput> leaders = normalizeLeaders(body == null ? null : body.get("leaders"));
        boolean hasDuplicate = hasDuplicateLeaders(body == null ? null : body.get("leaders"));
        if (missingField != null || leaders.isEmpty() || hasDuplicate) {
            String message = missingField != null
                ? missingField + " 不能为空"
                : hasDuplicate ? "同一个部门不能重复添加同一负责人" : "请至少维护一个完整负责人";
            throw new ApiException(message, 400);
        }
    }

    private void syncLeaders(long departmentId, List<LeaderInput> leaders) {
        departmentMapper.deleteLeaders(departmentId);
        for (int index = 0; index < leaders.size(); index++) {
            LeaderInput leader = leaders.get(index);
            departmentMapper.insertLeader(departmentId, leader.adminUserId(), index == 0, leader.phone(), leader.email());
        }
    }

    private static List<DepartmentNode> filterDepartmentTree(List<DepartmentNode> nodes, String keyword) {
        List<DepartmentNode> result = new ArrayList<>();
        for (DepartmentNode node : nodes) {
            List<DepartmentNode> children = filterDepartmentTree(node.getChildren(), keyword);
            boolean matched = node.getName().contains(keyword)
                || (node.getLeaderDisplay() != null && node.getLeaderDisplay().contains(keyword))
                || (node.getPhone() != null && node.getPhone().contains(keyword))
                || (node.getEmail() != null && node.getEmail().contains(keyword))
                || !children.isEmpty();
            if (matched) {
                DepartmentNode copy = node;
                copy.setChildren(children);
                result.add(copy);
            }
        }
        return result;
    }

    private static boolean hasDuplicateLeaders(Object value) {
        List<LeaderInput> leaders = normalizeLeaders(value);
        Set<Long> seen = new java.util.HashSet<>();
        for (LeaderInput leader : leaders) {
            if (!seen.add(leader.adminUserId())) {
                return true;
            }
        }
        return false;
    }

    @SuppressWarnings("unchecked")
    private static List<LeaderInput> normalizeLeaders(Object value) {
        if (!(value instanceof List<?> list)) {
            return List.of();
        }

        List<LeaderInput> leaders = new ArrayList<>();
        Set<Long> seen = new java.util.HashSet<>();
        for (Object item : list) {
            if (!(item instanceof Map<?, ?> map)) {
                continue;
            }
            Object adminUserIdValue = map.get("adminUserId");
            String phone = RequestUtils.trimToEmpty(map.get("phone"));
            String email = RequestUtils.trimToEmpty(map.get("email"));
            long adminUserId;
            if (adminUserIdValue instanceof Number number) {
                adminUserId = number.longValue();
            } else {
                try {
                    adminUserId = Long.parseLong(String.valueOf(adminUserIdValue));
                } catch (NumberFormatException exception) {
                    continue;
                }
            }
            if (adminUserId <= 0 || phone.isEmpty() || email.isEmpty() || !seen.add(adminUserId)) {
                continue;
            }
            leaders.add(new LeaderInput(adminUserId, phone, email));
        }
        return leaders;
    }

    private static Long parseNullableLong(Object value) {
        if (value == null || String.valueOf(value).isEmpty()) {
            return null;
        }
        if (value instanceof Number number) {
            return number.longValue();
        }
        return Long.parseLong(String.valueOf(value));
    }

    private record LeaderInput(long adminUserId, String phone, String email) {
    }
}
