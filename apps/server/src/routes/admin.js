import { Router } from 'express';
import crypto from 'crypto';
import { query } from '../db.js';
import { hashPassword, signToken, verifyPassword, verifyToken } from '../utils/auth.js';
import { ok, fail } from '../utils/response.js';

const router = Router();
const captchaStore = new Map();

function normalizeNumberArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.map((item) => Number(item)).filter((item) => Number.isInteger(item) && item > 0))];
}

function buildMenuTree(menuRows) {
  const menuMap = new Map();
  const roots = [];

  menuRows.forEach((menu) => {
    menuMap.set(menu.id, {
      ...menu,
      children: []
    });
  });

  menuMap.forEach((menu) => {
    if (menu.parentId === null) {
      roots.push(menu);
      return;
    }

    const parent = menuMap.get(menu.parentId);
    if (parent) {
      parent.children.push(menu);
      return;
    }

    roots.push(menu);
  });

  const sortNodes = (nodes) =>
    nodes
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
      .map((node) => ({
        ...node,
        children: node.children.length ? sortNodes(node.children) : []
      }));

  return sortNodes(roots);
}

function createInClauseParams(values) {
  return {
    placeholders: values.map(() => '?').join(', '),
    params: values
  };
}

async function hasRoleStatusColumn() {
  const rows = await query(
    `
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'roles'
        AND column_name = 'status'
      LIMIT 1
    `
  );

  return rows.length > 0;
}

async function expandMenuIdsWithAncestors(menuIds) {
  if (!menuIds.length) {
    return [];
  }

  const menuRows = await query(
    `
      SELECT
        id,
        parent_id AS parentId
      FROM menus
    `
  );

  const menuMap = new Map(menuRows.map((item) => [item.id, item]));
  const expandedIds = new Set(menuIds);

  for (const menuId of menuIds) {
    let current = menuMap.get(menuId);

    while (current?.parentId) {
      expandedIds.add(current.parentId);
      current = menuMap.get(current.parentId);
    }
  }

  return [...expandedIds];
}

async function syncAdminUserRoles(adminUserId, roleIds) {
  await query('DELETE FROM admin_user_roles WHERE admin_user_id = ?', [adminUserId]);

  for (const roleId of roleIds) {
    await query('INSERT INTO admin_user_roles (admin_user_id, role_id) VALUES (?, ?)', [adminUserId, roleId]);
  }
}

function normalizeDepartmentLeaders(value) {
  if (!Array.isArray(value)) {
    return { leaders: [], hasDuplicate: false };
  }

  const seen = new Set();
  let hasDuplicate = false;

  const leaders = value
    .map((item, index) => {
      const adminUserId = Number(item?.adminUserId);
      const phone = `${item?.phone || ''}`.trim();
      const email = `${item?.email || ''}`.trim();

      if (!Number.isInteger(adminUserId) || adminUserId <= 0 || !phone || !email) {
        return null;
      }

      if (seen.has(adminUserId)) {
        hasDuplicate = true;
        return null;
      }

      seen.add(adminUserId);

      return {
        adminUserId,
        phone,
        email,
        isPrimary: index === 0
      };
    })
    .filter(Boolean);

  return { leaders, hasDuplicate };
}

async function syncDepartmentLeaders(departmentId, leaders) {
  await query('DELETE FROM department_leaders WHERE department_id = ?', [departmentId]);

  for (const leader of leaders) {
    await query(
      'INSERT INTO department_leaders (department_id, admin_user_id, is_primary, phone, email) VALUES (?, ?, ?, ?, ?)',
      [departmentId, leader.adminUserId, leader.isPrimary ? 1 : 0, leader.phone, leader.email]
    );
  }
}

async function getAllPermissionRows() {
  return query(
    `
      SELECT
        id,
        permission_code
      FROM permissions
      ORDER BY id ASC
    `
  );
}

async function getAllActiveMenuRows() {
  return query(
    `
      SELECT
        id,
        parent_id AS parentId,
        name,
        path,
        component,
        permission_code AS permissionCode,
        menu_key AS menuKey,
        menu_type AS menuType,
        icon,
        status,
        visible,
        sort_order AS sortOrder
      FROM menus
      WHERE status = '启用'
      ORDER BY sort_order ASC, id ASC
    `
  );
}

function buildDepartmentTree(rows) {
  const nodeMap = new Map();
  const roots = [];

  rows.forEach((row) => {
    nodeMap.set(row.id, {
      ...row,
      children: []
    });
  });

  nodeMap.forEach((node) => {
    if (!node.parentId) {
      roots.push(node);
      return;
    }

    const parent = nodeMap.get(node.parentId);
    if (parent) {
      parent.children.push(node);
      return;
    }

    roots.push(node);
  });

  const sortNodes = (nodes) =>
    nodes
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
      .map((node) => ({
        ...node,
        children: node.children.length ? sortNodes(node.children) : []
      }));

  return sortNodes(roots);
}

function buildDictItemTree(rows) {
  const nodeMap = new Map();
  const roots = [];

  rows.forEach((row) => {
    nodeMap.set(row.id, {
      ...row,
      children: []
    });
  });

  nodeMap.forEach((node) => {
    if (!node.parentId) {
      roots.push(node);
      return;
    }

    const parent = nodeMap.get(node.parentId);
    if (parent) {
      parent.children.push(node);
      return;
    }

    roots.push(node);
  });

  const sortNodes = (nodes) =>
    nodes
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
      .map((node) => ({
        ...node,
        children: node.children.length ? sortNodes(node.children) : []
      }));

  return sortNodes(roots);
}

function formatPermissionTitle(permission) {
  const actionMap = {
    view: '列表',
    create: '新增',
    edit: '编辑',
    delete: '删除',
    assign: '授权',
    publish: '发布',
    freeze: '冻结',
    tag: '标签',
    audit: '审核'
  };

  const actionKey = permission.permissionCode.split('.').pop() || '';
  const actionLabel = actionMap[actionKey] || permission.permissionCode;

  return `${permission.groupName} / ${actionLabel}`;
}

function getPermissionActionLabel(permissionCode) {
  const actionMap = {
    view: '列表',
    create: '新增',
    edit: '编辑',
    delete: '删除',
    assign: '授权',
    publish: '发布',
    freeze: '冻结',
    tag: '标签',
    audit: '审核'
  };

  const actionKey = permissionCode.split('.').pop() || '';
  return actionMap[actionKey] || permissionCode;
}

async function getAuthorizationTree() {
  const [menuRows, permissionRows] = await Promise.all([
    getAllActiveMenuRows(),
    query(
      `
        SELECT
          id,
          permission_group AS groupKey,
          permission_group_name AS groupName,
          permission_code AS permissionCode,
          menu_id AS menuId
        FROM permissions
        ORDER BY id ASC
      `
    )
  ]);

  const menuTree = buildMenuTree(menuRows).map((menu) => ({
    ...menu,
    nodeType: 'menu',
    key: `menu-${menu.id}`,
    children: menu.children || []
  }));

  const attachPermissions = (nodes) =>
    nodes.map((node) => {
      const permissionChildren = permissionRows
        .filter((permission) => permission.menuId === node.id)
        .map((permission) => ({
          id: permission.id,
          key: `permission-${permission.id}`,
          title: formatPermissionTitle(permission),
          nodeType: 'permission',
          permissionCode: permission.permissionCode,
          children: []
        }));

      return {
        ...node,
        title: node.name,
        children: [...attachPermissions(node.children || []), ...permissionChildren]
      };
    });

  const assignedPermissionIds = new Set(permissionRows.filter((item) => item.menuId !== null).map((item) => item.id));
  const detachedGroups = new Map();

  permissionRows
    .filter((permission) => !assignedPermissionIds.has(permission.id))
    .forEach((permission) => {
      if (!detachedGroups.has(permission.groupKey)) {
        detachedGroups.set(permission.groupKey, {
          id: `group-${permission.groupKey}`,
          key: `group-${permission.groupKey}`,
          title: permission.groupName,
          nodeType: 'group',
          children: []
        });
      }

      detachedGroups.get(permission.groupKey).children.push({
        id: permission.id,
        key: `permission-${permission.id}`,
        title: formatPermissionTitle(permission),
        nodeType: 'permission',
        permissionCode: permission.permissionCode,
        children: []
      });
    });

  return [...attachPermissions(menuTree), ...detachedGroups.values()];
}

function createCaptchaText(length = 4) {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function createCaptchaSvg(text) {
  const chars = text
    .split('')
    .map((char, index) => {
      const rotate = [-18, -8, 7, 16][index] || 0;
      const x = 22 + index * 24;
      const y = 34 + (index % 2 === 0 ? 0 : 4);
      return `<text x="${x}" y="${y}" font-size="24" fill="#0f172a" transform="rotate(${rotate} ${x} ${y})">${char}</text>`;
    })
    .join('');

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="132" height="44" viewBox="0 0 132 44">
      <rect width="132" height="44" rx="10" fill="#f8fafc" />
      <path d="M8 32 C24 10, 40 42, 58 18 S92 8, 124 26" stroke="#99f6e4" stroke-width="3" fill="none" />
      <path d="M14 10 C28 28, 48 4, 72 20 S108 42, 124 12" stroke="#fed7aa" stroke-width="3" fill="none" />
      <g font-family="Verdana, sans-serif" font-weight="700">${chars}</g>
    </svg>
  `.trim();
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];

  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || '';
}

function parseUserAgent(userAgent = '') {
  const normalized = `${userAgent}`;
  const deviceType = /mobile|android|iphone|ipad/i.test(normalized) ? 'mobile' : 'desktop';

  const browser =
    /edg\//i.test(normalized)
      ? 'Edge'
      : /chrome\//i.test(normalized)
        ? 'Chrome'
        : /safari\//i.test(normalized) && !/chrome\//i.test(normalized)
          ? 'Safari'
          : /firefox\//i.test(normalized)
            ? 'Firefox'
            : '未知浏览器';

  const os =
    /windows/i.test(normalized)
      ? 'Windows'
      : /mac os x/i.test(normalized)
        ? 'macOS'
        : /android/i.test(normalized)
          ? 'Android'
          : /iphone|ipad|ios/i.test(normalized)
            ? 'iOS'
            : /linux/i.test(normalized)
              ? 'Linux'
              : '未知系统';

  return {
    deviceType,
    browser,
    os,
    deviceName: `${os} · ${browser}`
  };
}

async function createAdminSession(adminUserId, req) {
  const agent = parseUserAgent(req.headers['user-agent']);
  const ipAddress = getClientIp(req);

  await query('UPDATE admin_sessions SET is_current = 0 WHERE admin_user_id = ? AND status = ?', [adminUserId, '在线']);

  const result = await query(
    `
      INSERT INTO admin_sessions (
        admin_user_id,
        session_token,
        device_type,
        device_name,
        browser,
        os,
        ip_address,
        is_current,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, '在线')
    `,
    [adminUserId, crypto.randomBytes(24).toString('hex'), agent.deviceType, agent.deviceName, agent.browser, agent.os, ipAddress]
  );

  return result.insertId;
}

async function getAdminDetail(adminId) {
  const admins = await query(
    `
      SELECT
        au.id,
        au.name,
        au.account,
        au.phone,
        au.email,
        au.role_id,
        au.department_id AS departmentId,
        d.name AS departmentName,
        au.status
      FROM admin_users au
      LEFT JOIN departments d ON d.id = au.department_id
      WHERE au.id = ?
      LIMIT 1
    `,
    [adminId]
  );

  if (!admins.length) {
    return null;
  }

  const roleRows = await query(
    `
      SELECT
        r.id,
        r.name
      FROM admin_user_roles aur
      INNER JOIN roles r ON r.id = aur.role_id
      WHERE aur.admin_user_id = ?
      ORDER BY r.id ASC
    `,
    [adminId]
  );

  const roles = roleRows.length
    ? roleRows
    : admins[0].role_id
      ? await query('SELECT id, name FROM roles WHERE id = ? LIMIT 1', [admins[0].role_id])
      : [];

  const roleIds = roles.map((item) => item.id);
  const roleNameList = roles.map((item) => item.name);
  const isSuperAdmin = roleNameList.includes('超级管理员');
  const roleInClause = roleIds.length ? createInClauseParams(roleIds) : null;

  const permissions =
    isSuperAdmin
      ? await getAllPermissionRows()
      : roleInClause
        ? await query(
            `
              SELECT DISTINCT
                p.id,
                p.permission_code
              FROM role_permissions rp
              INNER JOIN permissions p ON p.id = rp.permission_id
              WHERE rp.role_id IN (${roleInClause.placeholders})
              ORDER BY p.id ASC
            `,
            roleInClause.params
          )
        : [];

  const assignedMenuIds =
    isSuperAdmin
      ? []
      : roleInClause
        ? (
            await query(
              `
                SELECT DISTINCT
                  rm.menu_id AS menuId
                FROM role_menus rm
                WHERE rm.role_id IN (${roleInClause.placeholders})
                ORDER BY rm.menu_id ASC
              `,
              roleInClause.params
            )
          ).map((item) => item.menuId)
        : [];

  const expandedMenuIds = isSuperAdmin ? assignedMenuIds : await expandMenuIdsWithAncestors(assignedMenuIds);
  const expandedMenuInClause = expandedMenuIds.length ? createInClauseParams(expandedMenuIds) : null;

  const menuRows = isSuperAdmin
    ? await getAllActiveMenuRows()
    : expandedMenuInClause
      ? await query(
          `
            SELECT
              m.id,
              m.parent_id AS parentId,
              m.name,
              m.path,
              m.component,
              m.permission_code AS permissionCode,
              m.menu_key AS menuKey,
              m.menu_type AS menuType,
              m.icon,
              m.status,
              m.visible,
              m.sort_order AS sortOrder
            FROM menus m
            WHERE m.id IN (${expandedMenuInClause.placeholders}) AND m.status = '启用'
            ORDER BY m.sort_order ASC, m.id ASC
          `,
          expandedMenuInClause.params
        )
      : [];

  const finalMenuIds = isSuperAdmin ? menuRows.map((item) => item.id) : expandedMenuIds;

  const visibleMenuTree = buildMenuTree(menuRows.filter((item) => item.visible === '显示' && item.menuType !== 'button'));

  return {
    ...admins[0],
    roles: roleNameList,
    roleIds,
    role: roleNameList.join(' / '),
    permissions: permissions.map((item) => item.permission_code),
    permissionIds: permissions.map((item) => item.id),
    menuIds: finalMenuIds,
    menus: visibleMenuTree
  };
}

function requireBodyFields(body, fields) {
  const missingField = fields.find((field) => body[field] === undefined || body[field] === null || body[field] === '');
  return missingField || null;
}

function normalizeAdminPreferences(value) {
  return {
    colorPrimary: typeof value?.colorPrimary === 'string' && value.colorPrimary.trim() ? value.colorPrimary.trim() : '#0f766e',
    showPageTabs: value?.showPageTabs !== false,
    compactContent: Boolean(value?.compactContent)
  };
}

async function authMiddleware(req, res, next) {
  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';

  if (!token) {
    return fail(res, '请先登录', 401);
  }

  let payload;

  try {
    payload = verifyToken(token);
  } catch (_error) {
    return fail(res, '登录已失效，请重新登录', 401);
  }

  try {
    if (payload.sessionId) {
      const sessionRows = await query(
        `
          SELECT id
          FROM admin_sessions
          WHERE id = ? AND admin_user_id = ? AND status = '在线'
          LIMIT 1
        `,
        [payload.sessionId, payload.adminId]
      );

      if (!sessionRows.length) {
        return fail(res, '当前登录设备已下线，请重新登录', 401);
      }

      await query('UPDATE admin_sessions SET last_active_at = NOW() WHERE id = ?', [payload.sessionId]);
    }

    const admin = await getAdminDetail(payload.adminId);

    if (!admin) {
      return fail(res, '管理员不存在', 401);
    }

    req.auth = {
      ...admin,
      sessionId: payload.sessionId || null
    };
    next();
  } catch (error) {
    if (error?.code === 'ER_NO_SUCH_TABLE') {
      return fail(res, '数据库缺少新表，请先执行最新 schema.sql', 500);
    }

    return fail(res, error.message || '管理员信息加载失败', 500);
  }
}

function requirePermission(permissionCode) {
  return (req, res, next) => {
    if (!req.auth.permissions.includes(permissionCode)) {
      return fail(res, '暂无操作权限', 403);
    }

    next();
  };
}

async function appendProjectAuditLog(projectId, action, fromStatus, toStatus, comment, operatorAdminId) {
  await query(
    `
      INSERT INTO project_audit_logs (project_id, action, from_status, to_status, comment, operator_admin_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [projectId, action, fromStatus || '', toStatus || '', comment || '', operatorAdminId || null]
  );
}

router.get('/auth/captcha', (_req, res) => {
  const captchaId = crypto.randomUUID();
  const text = createCaptchaText();

  captchaStore.set(captchaId, {
    text,
    expiresAt: Date.now() + 5 * 60 * 1000
  });

  ok(res, {
    captchaId,
    svg: createCaptchaSvg(text)
  });
});

router.post('/auth/login', async (req, res) => {
  const { account, password, captchaId, captchaCode } = req.body;
  const captchaRecord = captchaStore.get(captchaId);

  if (!captchaRecord || captchaRecord.expiresAt < Date.now()) {
    return fail(res, '验证码已过期，请刷新后重试', 400);
  }

  if ((captchaCode || '').trim().toUpperCase() !== captchaRecord.text) {
    return fail(res, '验证码错误', 400);
  }

  captchaStore.delete(captchaId);

  try {
    const rows = await query(
      `
        SELECT
          id,
          account,
          password,
          role_id,
          status
        FROM admin_users
        WHERE account = ?
        LIMIT 1
      `,
      [account]
    );

    if (!rows.length || !verifyPassword(password, rows[0].password)) {
      return fail(res, '账号或密码错误', 401);
    }

    if (rows[0].password && !rows[0].password.startsWith('scrypt$')) {
      await query('UPDATE admin_users SET password = ? WHERE id = ?', [hashPassword(password), rows[0].id]);
    }

    if (rows[0].status !== '启用') {
      return fail(res, '当前账号不可登录', 403);
    }

    const sessionId = await createAdminSession(rows[0].id, req);

    ok(
      res,
      {
        token: signToken({
          adminId: rows[0].id,
          roleId: rows[0].role_id,
          sessionId
        })
      },
      '登录成功'
    );
  } catch (error) {
    fail(res, error.message);
  }
});

router.post('/auth/logout', authMiddleware, async (req, res) => {
  try {
    if (req.auth.sessionId) {
      await query(
        `
          UPDATE admin_sessions
          SET status = '离线', is_current = 0, revoked_at = NOW()
          WHERE id = ? AND admin_user_id = ?
        `,
        [req.auth.sessionId, req.auth.id]
      );
    }

    ok(res, null, '已退出登录');
  } catch (error) {
    fail(res, error.message);
  }
});

router.use(authMiddleware);

router.get('/dashboard', async (_req, res) => {
  try {
    const [[systemUsers], [roles], [siteUsers], [projects]] = await Promise.all([
      query('SELECT COUNT(*) AS total FROM admin_users'),
      query('SELECT COUNT(*) AS total FROM roles'),
      query('SELECT COUNT(*) AS total FROM site_users'),
      query('SELECT COUNT(*) AS total FROM projects')
    ]);

    ok(res, {
      systemUsers: systemUsers.total,
      roles: roles.total,
      siteUsers: siteUsers.total,
      projects: projects.total
    });
  } catch (error) {
    fail(res, error.message);
  }
});

router.get('/current-admin', async (req, res) => {
  ok(res, req.auth);
});

router.get('/profile', async (req, res) => {
  try {
    const rows = await query(
      `
        SELECT
          au.id,
          au.name,
          au.account,
          au.phone,
          au.email,
          au.status,
          au.created_at AS createdAt,
          d.name AS departmentName
        FROM admin_users au
        LEFT JOIN departments d ON d.id = au.department_id
        WHERE au.id = ?
        LIMIT 1
      `,
      [req.auth.id]
    );

    if (!rows.length) {
      return fail(res, '管理员不存在', 404);
    }

    ok(res, {
      ...rows[0],
      role: req.auth.role,
      roles: req.auth.roles
    });
  } catch (error) {
    fail(res, error.message);
  }
});

router.put('/profile', async (req, res) => {
  const missingField = requireBodyFields(req.body, ['name']);

  if (missingField) {
    return fail(res, `缺少字段：${missingField}`, 400);
  }

  const name = `${req.body.name}`.trim();
  const phone = `${req.body.phone || ''}`.trim();
  const email = `${req.body.email || ''}`.trim();

  if (!name) {
    return fail(res, '姓名不能为空', 400);
  }

  if (phone && !/^1\d{10}$/.test(phone)) {
    return fail(res, '请输入正确的手机号', 400);
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return fail(res, '请输入正确的邮箱地址', 400);
  }

  try {
    await query('UPDATE admin_users SET name = ?, phone = ?, email = ? WHERE id = ?', [name, phone, email, req.auth.id]);
    ok(res, null, '个人资料已更新');
  } catch (error) {
    fail(res, error.message);
  }
});

router.post('/profile/change-password', async (req, res) => {
  const missingField = requireBodyFields(req.body, ['oldPassword', 'newPassword']);

  if (missingField) {
    return fail(res, `缺少字段：${missingField}`, 400);
  }

  const oldPassword = `${req.body.oldPassword}`;
  const newPassword = `${req.body.newPassword}`;

  if (newPassword.length < 6) {
    return fail(res, '新密码至少需要 6 位', 400);
  }

  if (oldPassword === newPassword) {
    return fail(res, '新密码不能与当前密码相同', 400);
  }

  try {
    const rows = await query('SELECT password FROM admin_users WHERE id = ? LIMIT 1', [req.auth.id]);

    if (!rows.length || !verifyPassword(oldPassword, rows[0].password)) {
      return fail(res, '当前密码错误', 400);
    }

    await query('UPDATE admin_users SET password = ? WHERE id = ?', [hashPassword(newPassword), req.auth.id]);
    ok(res, null, '密码已更新');
  } catch (error) {
    fail(res, error.message);
  }
});

router.get('/profile/preferences', async (req, res) => {
  try {
    const rows = await query(
      `
        SELECT
          color_primary AS colorPrimary,
          show_page_tabs AS showPageTabs,
          compact_content AS compactContent
        FROM admin_preferences
        WHERE admin_user_id = ?
        LIMIT 1
      `,
      [req.auth.id]
    );

    const preferences = rows.length
      ? {
          colorPrimary: rows[0].colorPrimary,
          showPageTabs: Boolean(rows[0].showPageTabs),
          compactContent: Boolean(rows[0].compactContent)
        }
      : normalizeAdminPreferences({});

    ok(res, preferences);
  } catch (error) {
    fail(res, error.message);
  }
});

router.put('/profile/preferences', async (req, res) => {
  const preferences = normalizeAdminPreferences(req.body);

  if (!/^#[0-9a-fA-F]{6}$/.test(preferences.colorPrimary)) {
    return fail(res, '主题主色格式不正确', 400);
  }

  try {
    await query(
      `
        INSERT INTO admin_preferences (admin_user_id, color_primary, show_page_tabs, compact_content)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          color_primary = VALUES(color_primary),
          show_page_tabs = VALUES(show_page_tabs),
          compact_content = VALUES(compact_content)
      `,
      [req.auth.id, preferences.colorPrimary, preferences.showPageTabs ? 1 : 0, preferences.compactContent ? 1 : 0]
    );

    ok(res, preferences, '界面偏好已更新');
  } catch (error) {
    fail(res, error.message);
  }
});

router.get('/profile/devices', async (req, res) => {
  try {
    const rows = await query(
      `
        SELECT
          id,
          device_type AS deviceType,
          device_name AS deviceName,
          browser,
          os,
          ip_address AS ipAddress,
          is_current AS isCurrent,
          status,
          last_active_at AS lastActiveAt,
          created_at AS createdAt
        FROM admin_sessions
        WHERE admin_user_id = ?
        ORDER BY is_current DESC, last_active_at DESC, id DESC
      `,
      [req.auth.id]
    );

    ok(
      res,
      rows.map((item) => ({
        ...item,
        isCurrent: Boolean(item.isCurrent)
      }))
    );
  } catch (error) {
    fail(res, error.message);
  }
});

router.delete('/profile/devices/:id', async (req, res) => {
  const sessionId = Number(req.params.id);

  if (!Number.isInteger(sessionId) || sessionId <= 0) {
    return fail(res, '无效的设备会话', 400);
  }

  try {
    const result = await query(
      `
        UPDATE admin_sessions
        SET status = '离线', is_current = 0, revoked_at = NOW()
        WHERE id = ? AND admin_user_id = ? AND status = '在线'
      `,
      [sessionId, req.auth.id]
    );

    if (!result.affectedRows) {
      return fail(res, '设备不存在或已离线', 404);
    }

    ok(res, null, '设备已下线');
  } catch (error) {
    fail(res, error.message);
  }
});

router.get('/profile/integrations', async (req, res) => {
  try {
    const rows = await query(
      `
        SELECT
          ai.id,
          ai.app_key AS appKey,
          ai.app_name AS appName,
          ai.app_type AS appType,
          ai.description,
          ai.status,
          ai.icon,
          aib.account_name AS accountName,
          aib.bound_at AS boundAt,
          CASE WHEN aib.id IS NULL THEN 0 ELSE 1 END AS isBound
        FROM admin_integrations ai
        LEFT JOIN admin_integration_bindings aib
          ON aib.integration_id = ai.id AND aib.admin_user_id = ?
        ORDER BY ai.sort_order ASC, ai.id ASC
      `,
      [req.auth.id]
    );

    ok(
      res,
      rows.map((item) => ({
        ...item,
        isBound: Boolean(item.isBound)
      }))
    );
  } catch (error) {
    fail(res, error.message);
  }
});

router.post('/profile/integrations/:id/bind', async (req, res) => {
  const integrationId = Number(req.params.id);
  const accountName = `${req.body.accountName || ''}`.trim();

  if (!Number.isInteger(integrationId) || integrationId <= 0) {
    return fail(res, '无效的应用', 400);
  }

  if (!accountName) {
    return fail(res, '请输入关联账号', 400);
  }

  try {
    const rows = await query('SELECT id, status FROM admin_integrations WHERE id = ? LIMIT 1', [integrationId]);

    if (!rows.length) {
      return fail(res, '应用不存在', 404);
    }

    if (rows[0].status !== '启用') {
      return fail(res, '该应用暂不可绑定', 400);
    }

    await query(
      `
        INSERT INTO admin_integration_bindings (admin_user_id, integration_id, account_name, status)
        VALUES (?, ?, ?, '已绑定')
        ON DUPLICATE KEY UPDATE
          account_name = VALUES(account_name),
          status = '已绑定',
          bound_at = CURRENT_TIMESTAMP
      `,
      [req.auth.id, integrationId, accountName]
    );

    ok(res, null, '应用已绑定');
  } catch (error) {
    fail(res, error.message);
  }
});

router.delete('/profile/integrations/:id/bind', async (req, res) => {
  const integrationId = Number(req.params.id);

  if (!Number.isInteger(integrationId) || integrationId <= 0) {
    return fail(res, '无效的应用', 400);
  }

  try {
    const result = await query('DELETE FROM admin_integration_bindings WHERE admin_user_id = ? AND integration_id = ?', [
      req.auth.id,
      integrationId
    ]);

    if (!result.affectedRows) {
      return fail(res, '绑定记录不存在', 404);
    }

    ok(res, null, '应用已解绑');
  } catch (error) {
    fail(res, error.message);
  }
});

router.get('/system-users', requirePermission('system_user.view'), async (req, res) => {
  const keyword = req.query.keyword?.trim() || '';
  const status = req.query.status?.trim() || '';

  try {
    const conditions = [];
    const params = [];

    if (keyword) {
      conditions.push('(au.name LIKE ? OR au.account LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    if (status) {
      conditions.push('au.status = ?');
      params.push(status);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = await query(
      `
        SELECT
          au.id,
          au.name,
          au.account,
          au.department_id AS departmentId,
          d.name AS departmentName,
          au.status
        FROM admin_users au
        LEFT JOIN departments d ON d.id = au.department_id
        ${whereClause}
        ORDER BY au.id ASC
      `,
      params
    );

    const roleRows = await query(
      `
        SELECT
          aur.admin_user_id AS adminUserId,
          r.id AS roleId,
          r.name AS roleName
        FROM admin_user_roles aur
        INNER JOIN roles r ON r.id = aur.role_id
        ORDER BY aur.admin_user_id ASC, r.id ASC
      `
    );

    ok(
      res,
      rows.map((item) => {
        const userRoles = roleRows.filter((role) => role.adminUserId === item.id);
        return {
          ...item,
          departmentId: item.departmentId,
          departmentName: item.departmentName,
          roleIds: userRoles.map((role) => role.roleId),
          roles: userRoles.map((role) => role.roleName)
        };
      })
    );
  } catch (error) {
    fail(res, error.message);
  }
});

router.post('/system-users', requirePermission('system_user.create'), async (req, res) => {
  const missingField = requireBodyFields(req.body, ['name', 'account', 'password', 'status', 'departmentId']);
  const roleIds = normalizeNumberArray(req.body.roleIds);

  if (missingField || !roleIds.length) {
    return fail(res, missingField ? `${missingField} 不能为空` : '请至少选择一个角色', 400);
  }

  try {
    const result = await query(
      `
        INSERT INTO admin_users (name, account, password, role_id, department_id, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [req.body.name, req.body.account, hashPassword(req.body.password), roleIds[0], req.body.departmentId, req.body.status]
    );

    await syncAdminUserRoles(result.insertId, roleIds);
    ok(res, { id: result.insertId }, '系统用户创建成功');
  } catch (error) {
    fail(res, error.message);
  }
});

router.put('/system-users/:id', requirePermission('system_user.edit'), async (req, res) => {
  const missingField = requireBodyFields(req.body, ['name', 'account', 'status', 'departmentId']);
  const roleIds = normalizeNumberArray(req.body.roleIds);

  if (missingField || !roleIds.length) {
    return fail(res, missingField ? `${missingField} 不能为空` : '请至少选择一个角色', 400);
  }

  try {
    const updates = ['name = ?', 'account = ?', 'role_id = ?', 'department_id = ?', 'status = ?'];
    const params = [req.body.name, req.body.account, roleIds[0], req.body.departmentId, req.body.status];

    if (req.body.password) {
      updates.push('password = ?');
      params.push(hashPassword(req.body.password));
    }

    params.push(req.params.id);

    await query(`UPDATE admin_users SET ${updates.join(', ')} WHERE id = ?`, params);
    await syncAdminUserRoles(Number(req.params.id), roleIds);
    ok(res, null, '系统用户更新成功');
  } catch (error) {
    fail(res, error.message);
  }
});

router.patch('/system-users/:id/status', requirePermission('system_user.edit'), async (req, res) => {
  if (!req.body.status) {
    return fail(res, 'status 不能为空', 400);
  }

  try {
    await query('UPDATE admin_users SET status = ? WHERE id = ?', [req.body.status, req.params.id]);
    ok(res, null, '状态更新成功');
  } catch (error) {
    fail(res, error.message);
  }
});

router.delete('/system-users/:id', requirePermission('system_user.delete'), async (req, res) => {
  if (Number(req.params.id) === req.auth.id) {
    return fail(res, '不能删除当前登录账号', 400);
  }

  try {
    await query('DELETE FROM admin_user_roles WHERE admin_user_id = ?', [req.params.id]);
    await query('DELETE FROM admin_users WHERE id = ?', [req.params.id]);
    ok(res, null, '系统用户删除成功');
  } catch (error) {
    fail(res, error.message);
  }
});

router.get('/roles', requirePermission('role.view'), async (_req, res) => {
  try {
    const hasStatus = await hasRoleStatusColumn();
    const rows = await query(
      `
        SELECT
          r.id,
          r.name,
          r.scope,
          ${hasStatus ? 'r.status' : "'启用'"} AS status,
          COUNT(DISTINCT aur.admin_user_id) AS members
        FROM roles r
        LEFT JOIN admin_user_roles aur ON aur.role_id = r.id
        GROUP BY r.id, r.name, r.scope${hasStatus ? ', r.status' : ''}
        ORDER BY r.id ASC
      `
    );

    ok(res, rows);
  } catch (error) {
    fail(res, error.message);
  }
});

router.get('/roles/:id', requirePermission('role.view'), async (req, res) => {
  try {
    const hasStatus = await hasRoleStatusColumn();
    const roles = await query(
      `SELECT id, name, scope, ${hasStatus ? 'status' : "'启用'"} AS status FROM roles WHERE id = ? LIMIT 1`,
      [req.params.id]
    );

    if (!roles.length) {
      return fail(res, '角色不存在', 404);
    }

    const [permissionIds, menuIds] = await Promise.all([
      query('SELECT permission_id FROM role_permissions WHERE role_id = ? ORDER BY permission_id ASC', [req.params.id]),
      query('SELECT menu_id FROM role_menus WHERE role_id = ? ORDER BY menu_id ASC', [req.params.id])
    ]);

    const expandedMenuIds = await expandMenuIdsWithAncestors(menuIds.map((item) => item.menu_id));

    ok(res, {
      ...roles[0],
      permissionIds: permissionIds.map((item) => item.permission_id),
      menuIds: expandedMenuIds
    });
  } catch (error) {
    fail(res, error.message);
  }
});

router.post('/roles', requirePermission('role.create'), async (req, res) => {
  const missingField = requireBodyFields(req.body, ['name', 'scope']);

  if (missingField) {
    return fail(res, `${missingField} 不能为空`, 400);
  }

  try {
    const hasStatus = await hasRoleStatusColumn();
    const fields = ['name', 'scope'];
    const values = [req.body.name, req.body.scope];

    if (hasStatus) {
      fields.push('status');
      values.push(req.body.status || '启用');
    }

    const result = await query(`INSERT INTO roles (${fields.join(', ')}) VALUES (${fields.map(() => '?').join(', ')})`, values);
    ok(res, { id: result.insertId }, '角色创建成功');
  } catch (error) {
    fail(res, error.message);
  }
});

router.put('/roles/:id', requirePermission('role.edit'), async (req, res) => {
  const missingField = requireBodyFields(req.body, ['name', 'scope']);

  if (missingField) {
    return fail(res, `${missingField} 不能为空`, 400);
  }

  try {
    const hasStatus = await hasRoleStatusColumn();
    const updates = ['name = ?', 'scope = ?'];
    const params = [req.body.name, req.body.scope];

    if (hasStatus) {
      updates.push('status = ?');
      params.push(req.body.status || '启用');
    }

    params.push(req.params.id);
    await query(`UPDATE roles SET ${updates.join(', ')} WHERE id = ?`, params);
    ok(res, null, '角色更新成功');
  } catch (error) {
    fail(res, error.message);
  }
});

router.patch('/roles/:id/status', requirePermission('role.edit'), async (req, res) => {
  try {
    const hasStatus = await hasRoleStatusColumn();

    if (!hasStatus) {
      return ok(res, null, '当前数据库未启用角色状态字段');
    }

    await query('UPDATE roles SET status = ? WHERE id = ?', [req.body.status, req.params.id]);
    ok(res, null, '角色状态已更新');
  } catch (error) {
    fail(res, error.message);
  }
});

router.put('/roles/:id/permissions', requirePermission('role.assign'), async (req, res) => {
  const permissionIds = normalizeNumberArray(req.body.permissionIds);

  try {
    await query('DELETE FROM role_permissions WHERE role_id = ?', [req.params.id]);

    for (const permissionId of permissionIds) {
      await query('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [req.params.id, permissionId]);
    }

    ok(res, null, '角色权限分配成功');
  } catch (error) {
    fail(res, error.message);
  }
});

router.put('/roles/:id/menus', requirePermission('role.assign'), async (req, res) => {
  const menuIds = normalizeNumberArray(req.body.menuIds);

  try {
    const expandedMenuIds = await expandMenuIdsWithAncestors(menuIds);
    await query('DELETE FROM role_menus WHERE role_id = ?', [req.params.id]);

    for (const menuId of expandedMenuIds) {
      await query('INSERT INTO role_menus (role_id, menu_id) VALUES (?, ?)', [req.params.id, menuId]);
    }

    ok(res, null, '角色菜单分配成功');
  } catch (error) {
    fail(res, error.message);
  }
});

router.delete('/roles/:id', requirePermission('role.delete'), async (req, res) => {
  try {
    const members = await query('SELECT COUNT(*) AS total FROM admin_user_roles WHERE role_id = ?', [req.params.id]);

    if (members[0].total > 0) {
      return fail(res, '该角色下仍有关联用户，无法删除', 400);
    }

    await query('DELETE FROM role_permissions WHERE role_id = ?', [req.params.id]);
    await query('DELETE FROM role_menus WHERE role_id = ?', [req.params.id]);
    await query('DELETE FROM roles WHERE id = ?', [req.params.id]);
    ok(res, null, '角色删除成功');
  } catch (error) {
    fail(res, error.message);
  }
});

router.get('/dict-types', requirePermission('dict.edit'), async (req, res) => {
  const keyword = req.query.keyword?.trim() || '';
  const status = req.query.status?.trim() || '';

  try {
    const conditions = [];
    const params = [];

    if (keyword) {
      conditions.push('(dt.name LIKE ? OR dt.code LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    if (status) {
      conditions.push('dt.status = ?');
      params.push(status);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = await query(
      `
        SELECT
          dt.id,
          dt.name,
          dt.code,
          dt.value_type AS valueType,
          dt.status,
          dt.sort_order AS sortOrder,
          dt.remark,
          COUNT(di.id) AS itemCount
        FROM dict_types dt
        LEFT JOIN dict_items di ON di.dict_type_id = dt.id
        ${whereClause}
        GROUP BY dt.id, dt.name, dt.code, dt.value_type, dt.status, dt.sort_order, dt.remark
        ORDER BY dt.sort_order ASC, dt.id ASC
      `,
      params
    );

    ok(res, rows);
  } catch (error) {
    fail(res, error.message);
  }
});

router.post('/dict-types', requirePermission('dict.create'), async (req, res) => {
  const missingField = requireBodyFields(req.body, ['name', 'code', 'valueType', 'status']);

  if (missingField) {
    return fail(res, `${missingField} 不能为空`, 400);
  }

  try {
    const result = await query(
      `
        INSERT INTO dict_types (name, code, value_type, status, sort_order, remark)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [req.body.name, req.body.code, req.body.valueType, req.body.status, req.body.sortOrder || 0, req.body.remark || '']
    );

    ok(res, { id: result.insertId }, '字典类型创建成功');
  } catch (error) {
    fail(res, error.message);
  }
});

router.put('/dict-types/:id', requirePermission('dict.edit'), async (req, res) => {
  const missingField = requireBodyFields(req.body, ['name', 'code', 'valueType', 'status']);

  if (missingField) {
    return fail(res, `${missingField} 不能为空`, 400);
  }

  try {
    await query(
      `
        UPDATE dict_types
        SET name = ?, code = ?, value_type = ?, status = ?, sort_order = ?, remark = ?
        WHERE id = ?
      `,
      [req.body.name, req.body.code, req.body.valueType, req.body.status, req.body.sortOrder || 0, req.body.remark || '', req.params.id]
    );

    ok(res, null, '字典类型更新成功');
  } catch (error) {
    fail(res, error.message);
  }
});

router.delete('/dict-types/:id', requirePermission('dict.delete'), async (req, res) => {
  try {
    const items = await query('SELECT COUNT(*) AS total FROM dict_items WHERE dict_type_id = ?', [req.params.id]);

    if (items[0].total > 0) {
      return fail(res, '该字典下仍有字典项，无法删除', 400);
    }

    await query('DELETE FROM dict_types WHERE id = ?', [req.params.id]);
    ok(res, null, '字典类型删除成功');
  } catch (error) {
    fail(res, error.message);
  }
});

router.get('/dict-types/:id/items', requirePermission('dict.edit'), async (req, res) => {
  const keyword = req.query.keyword?.trim() || '';
  const status = req.query.status?.trim() || '';
  const viewMode = req.query.viewMode === 'tree' ? 'tree' : 'flat';

  try {
    const rows = await query(
      `
        SELECT
          id,
          dict_type_id AS dictTypeId,
          parent_id AS parentId,
          label,
          value,
          status,
          sort_order AS sortOrder,
          remark
        FROM dict_items
        WHERE dict_type_id = ?
        ORDER BY sort_order ASC, id ASC
      `,
      [req.params.id]
    );

    const filteredRows = rows.filter((item) => {
      const matchKeyword = !keyword || item.label.includes(keyword) || item.value.includes(keyword);
      const matchStatus = !status || item.status === status;
      return matchKeyword && matchStatus;
    });

    ok(res, viewMode === 'tree' ? buildDictItemTree(filteredRows) : filteredRows);
  } catch (error) {
    fail(res, error.message);
  }
});

router.post('/dict-items', requirePermission('dict.create'), async (req, res) => {
  const missingField = requireBodyFields(req.body, ['dictTypeId', 'label', 'value', 'status']);

  if (missingField) {
    return fail(res, `${missingField} 不能为空`, 400);
  }

  try {
    const result = await query(
      `
        INSERT INTO dict_items (dict_type_id, parent_id, label, value, status, sort_order, remark)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        req.body.dictTypeId,
        req.body.parentId || null,
        req.body.label,
        req.body.value,
        req.body.status,
        req.body.sortOrder || 0,
        req.body.remark || ''
      ]
    );

    ok(res, { id: result.insertId }, '字典项创建成功');
  } catch (error) {
    fail(res, error.message);
  }
});

router.put('/dict-items/:id', requirePermission('dict.edit'), async (req, res) => {
  const missingField = requireBodyFields(req.body, ['dictTypeId', 'label', 'value', 'status']);

  if (missingField) {
    return fail(res, `${missingField} 不能为空`, 400);
  }

  try {
    await query(
      `
        UPDATE dict_items
        SET dict_type_id = ?, parent_id = ?, label = ?, value = ?, status = ?, sort_order = ?, remark = ?
        WHERE id = ?
      `,
      [
        req.body.dictTypeId,
        req.body.parentId || null,
        req.body.label,
        req.body.value,
        req.body.status,
        req.body.sortOrder || 0,
        req.body.remark || '',
        req.params.id
      ]
    );

    ok(res, null, '字典项更新成功');
  } catch (error) {
    fail(res, error.message);
  }
});

router.delete('/dict-items/:id', requirePermission('dict.delete'), async (req, res) => {
  try {
    const children = await query('SELECT COUNT(*) AS total FROM dict_items WHERE parent_id = ?', [req.params.id]);

    if (children[0].total > 0) {
      return fail(res, '请先删除下级字典项', 400);
    }

    await query('DELETE FROM dict_items WHERE id = ?', [req.params.id]);
    ok(res, null, '字典项删除成功');
  } catch (error) {
    fail(res, error.message);
  }
});

router.get('/departments', requirePermission('department.edit'), async (req, res) => {
  const keyword = req.query.keyword?.trim() || '';

  try {
    const [rows, leaderRows] = await Promise.all([
      query(
        `
          SELECT
            id,
            parent_id AS parentId,
            name,
            phone,
            email,
            status,
            sort_order AS sortOrder
          FROM departments
          ORDER BY sort_order ASC, id ASC
        `
      ),
      query(
        `
          SELECT
            dl.department_id AS departmentId,
            dl.admin_user_id AS adminUserId,
            dl.is_primary AS isPrimary,
            dl.phone,
            dl.email,
            au.name
          FROM department_leaders dl
          INNER JOIN admin_users au ON au.id = dl.admin_user_id
          ORDER BY dl.department_id ASC, dl.is_primary DESC, dl.id ASC
        `
      )
    ]);

    const leaderMap = new Map();

    leaderRows.forEach((item) => {
      const current = leaderMap.get(item.departmentId) || [];
      current.push({
        adminUserId: item.adminUserId,
        name: item.name,
        phone: item.phone,
        email: item.email,
        isPrimary: Boolean(item.isPrimary)
      });
      leaderMap.set(item.departmentId, current);
    });

    const mergedRows = rows.map((item) => {
      const leaders = leaderMap.get(item.id) || [];
      const primaryLeader = leaders.find((leader) => leader.isPrimary) || leaders[0] || null;
      return {
        ...item,
        leaders,
        leaderDisplay: leaders.map((leader) => leader.name).join('、'),
        phone: primaryLeader?.phone || item.phone,
        email: primaryLeader?.email || item.email,
        primaryLeaderName: primaryLeader?.name || null
      };
    });

    const tree = buildDepartmentTree(mergedRows);

    if (!keyword) {
      return ok(res, tree);
    }

    const filterNodes = (nodes) =>
      nodes
        .map((node) => {
          const children = filterNodes(node.children || []);
          if (
            node.name.includes(keyword) ||
            node.leaderDisplay.includes(keyword) ||
            node.phone.includes(keyword) ||
            node.email.includes(keyword) ||
            children.length
          ) {
            return { ...node, children };
          }
          return null;
        })
        .filter(Boolean);

    ok(res, filterNodes(tree));
  } catch (error) {
    fail(res, error.message);
  }
});

router.post('/departments', requirePermission('department.create'), async (req, res) => {
  const missingField = requireBodyFields(req.body, ['name', 'status']);
  const { leaders, hasDuplicate } = normalizeDepartmentLeaders(req.body.leaders);

  if (missingField || !leaders.length || hasDuplicate) {
    return fail(
      res,
      missingField ? `${missingField} 不能为空` : hasDuplicate ? '同一个部门不能重复添加同一负责人' : '请至少维护一个完整负责人',
      400
    );
  }

  try {
    const primaryLeader = leaders[0];
    const result = await query(
      `
        INSERT INTO departments (parent_id, name, phone, email, status, sort_order)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [req.body.parentId || null, req.body.name, primaryLeader.phone, primaryLeader.email, req.body.status, req.body.sortOrder || 0]
    );

    await syncDepartmentLeaders(result.insertId, leaders);

    ok(res, { id: result.insertId }, '部门创建成功');
  } catch (error) {
    fail(res, error.message);
  }
});

router.put('/departments/:id', requirePermission('department.edit'), async (req, res) => {
  const missingField = requireBodyFields(req.body, ['name', 'status']);
  const { leaders, hasDuplicate } = normalizeDepartmentLeaders(req.body.leaders);

  if (missingField || !leaders.length || hasDuplicate) {
    return fail(
      res,
      missingField ? `${missingField} 不能为空` : hasDuplicate ? '同一个部门不能重复添加同一负责人' : '请至少维护一个完整负责人',
      400
    );
  }

  try {
    const primaryLeader = leaders[0];
    await query(
      `
        UPDATE departments
        SET parent_id = ?, name = ?, phone = ?, email = ?, status = ?, sort_order = ?
        WHERE id = ?
      `,
      [
        req.body.parentId || null,
        req.body.name,
        primaryLeader.phone,
        primaryLeader.email,
        req.body.status,
        req.body.sortOrder || 0,
        req.params.id
      ]
    );

    await syncDepartmentLeaders(Number(req.params.id), leaders);

    ok(res, null, '部门更新成功');
  } catch (error) {
    fail(res, error.message);
  }
});

router.delete('/departments/:id', requirePermission('department.delete'), async (req, res) => {
  try {
    const [children, members] = await Promise.all([
      query('SELECT COUNT(*) AS total FROM departments WHERE parent_id = ?', [req.params.id]),
      query('SELECT COUNT(*) AS total FROM admin_users WHERE department_id = ?', [req.params.id])
    ]);

    if (children[0].total > 0) {
      return fail(res, '请先删除下级部门', 400);
    }

    if (members[0].total > 0) {
      return fail(res, '该部门下仍有关联系统用户', 400);
    }

    await query('DELETE FROM department_leaders WHERE department_id = ?', [req.params.id]);
    await query('DELETE FROM departments WHERE id = ?', [req.params.id]);
    ok(res, null, '部门删除成功');
  } catch (error) {
    fail(res, error.message);
  }
});

router.get('/department-user-options', requirePermission('department.edit'), async (_req, res) => {
  try {
    const rows = await query(
      `
        SELECT
          id,
          name,
          account,
          department_id AS departmentId,
          status
        FROM admin_users
        WHERE status = '启用'
        ORDER BY id ASC
      `
    );

    ok(res, rows);
  } catch (error) {
    fail(res, error.message);
  }
});

router.get('/site-users', requirePermission('site_user.view'), async (req, res) => {
  const keyword = req.query.keyword?.trim() || '';
  const status = req.query.status?.trim() || '';

  try {
    const conditions = [];
    const params = [];

    if (keyword) {
      conditions.push('(nickname LIKE ? OR phone LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = await query(
      `
        SELECT
          id,
          nickname,
          phone,
          member_level AS level,
          status
        FROM site_users
        ${whereClause}
        ORDER BY id ASC
      `,
      params
    );

    ok(res, rows);
  } catch (error) {
    fail(res, error.message);
  }
});

router.post('/site-users', requirePermission('site_user.tag'), async (req, res) => {
  const missingField = requireBodyFields(req.body, ['nickname', 'phone', 'level', 'status']);

  if (missingField) {
    return fail(res, `${missingField} 不能为空`, 400);
  }

  if (!['正常', '冻结'].includes(req.body.status)) {
    return fail(res, '网站用户状态仅支持 正常 或 冻结', 400);
  }

  try {
    const result = await query(
      'INSERT INTO site_users (nickname, phone, member_level, status) VALUES (?, ?, ?, ?)',
      [req.body.nickname, req.body.phone, req.body.level, req.body.status]
    );

    ok(res, { id: result.insertId }, '网站用户创建成功');
  } catch (error) {
    fail(res, error.message);
  }
});

router.put('/site-users/:id', requirePermission('site_user.tag'), async (req, res) => {
  const missingField = requireBodyFields(req.body, ['nickname', 'phone', 'level', 'status']);

  if (missingField) {
    return fail(res, `${missingField} 不能为空`, 400);
  }

  if (!['正常', '冻结'].includes(req.body.status)) {
    return fail(res, '网站用户状态仅支持 正常 或 冻结', 400);
  }

  try {
    await query(
      'UPDATE site_users SET nickname = ?, phone = ?, member_level = ?, status = ? WHERE id = ?',
      [req.body.nickname, req.body.phone, req.body.level, req.body.status, req.params.id]
    );

    ok(res, null, '网站用户更新成功');
  } catch (error) {
    fail(res, error.message);
  }
});

router.patch('/site-users/:id/status', requirePermission('site_user.freeze'), async (req, res) => {
  if (!req.body.status) {
    return fail(res, 'status 不能为空', 400);
  }

  if (!['正常', '冻结'].includes(req.body.status)) {
    return fail(res, '网站用户状态仅支持 正常 或 冻结', 400);
  }

  try {
    await query('UPDATE site_users SET status = ? WHERE id = ?', [req.body.status, req.params.id]);
    ok(res, null, '网站用户状态更新成功');
  } catch (error) {
    fail(res, error.message);
  }
});

router.delete('/site-users/:id', requirePermission('site_user.tag'), async (req, res) => {
  try {
    await query('DELETE FROM site_users WHERE id = ?', [req.params.id]);
    ok(res, null, '网站用户删除成功');
  } catch (error) {
    fail(res, error.message);
  }
});

router.get('/permissions', requirePermission('permission.view'), async (_req, res) => {
  try {
    const groups = await query(
      `
        SELECT
          permission_group AS \`key\`,
          permission_group_name AS name
        FROM permissions
        GROUP BY permission_group, permission_group_name
        ORDER BY MIN(id) ASC
      `
    );

    const permissions = await query(
      `
        SELECT
          id,
          permission_group AS groupKey,
          permission_code
        FROM permissions
        ORDER BY id ASC
      `
    );

    ok(
      res,
      groups.map((group) => ({
        ...group,
        permissions: permissions
          .filter((item) => item.groupKey === group.key)
          .map((item) => ({
            id: item.id,
            code: item.permission_code
          }))
      }))
    );
  } catch (error) {
    fail(res, error.message);
  }
});

router.get('/authorization-tree', requirePermission('role.assign'), async (_req, res) => {
  try {
    ok(res, await getAuthorizationTree());
  } catch (error) {
    fail(res, error.message);
  }
});

router.get('/menus', requirePermission('menu.view'), async (_req, res) => {
  try {
    const [menuRows, permissionRows] = await Promise.all([
      query(
        `
          SELECT
            id,
            parent_id AS parentId,
            name,
            path,
            component,
            permission_code AS permissionCode,
            menu_key AS menuKey,
            menu_type AS menuType,
            icon,
            status,
            visible,
            sort_order AS sortOrder
          FROM menus
          ORDER BY sort_order ASC, id ASC
        `
      ),
      query(
        `
          SELECT
            id,
            permission_group_name AS groupName,
            permission_code AS permissionCode,
            menu_id AS menuId
          FROM permissions
          WHERE menu_id IS NOT NULL
          ORDER BY id ASC
        `
      )
    ]);

    const normalizedMenuRows = menuRows.map((item) =>
      item.menuType === 'button' && item.permissionCode
        ? {
            ...item,
            name: getPermissionActionLabel(item.permissionCode)
          }
        : item
    );
    const existingButtonCodes = new Set(
      normalizedMenuRows.filter((item) => item.menuType === 'button' && item.permissionCode).map((item) => item.permissionCode)
    );
    const derivedButtonRows = permissionRows
      .filter((item) => !existingButtonCodes.has(item.permissionCode))
      .map((item, index) => {
        return {
          id: -item.id,
          parentId: item.menuId,
          name: getPermissionActionLabel(item.permissionCode),
          path: '',
          component: '',
          permissionCode: item.permissionCode,
          menuKey: `permission:${item.permissionCode}`,
          menuType: 'button',
          icon: '',
          status: '启用',
          visible: '隐藏',
          sortOrder: 1000 + index,
          sourceType: 'permission',
          groupName: item.groupName
        };
      });

    ok(
      res,
      buildMenuTree(
        [...normalizedMenuRows.map((item) => ({ ...item, sourceType: 'menu' })), ...derivedButtonRows].map((item) => ({
          ...item,
          sourceType: item.sourceType || 'menu'
        }))
      )
    );
  } catch (error) {
    fail(res, error.message);
  }
});

router.post('/menus', requirePermission('menu.create'), async (req, res) => {
  const missingField = requireBodyFields(req.body, ['name', 'menuKey', 'menuType', 'status', 'visible']);

  if (missingField) {
    return fail(res, `${missingField} 不能为空`, 400);
  }

  try {
    const result = await query(
      `
        INSERT INTO menus (parent_id, name, path, component, permission_code, menu_key, menu_type, icon, status, visible, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        req.body.parentId || null,
        req.body.name,
        req.body.path || '',
        req.body.component || '',
        req.body.permissionCode || '',
        req.body.menuKey,
        req.body.menuType,
        req.body.icon || '',
        req.body.status,
        req.body.visible,
        req.body.sortOrder || 0
      ]
    );

    ok(res, { id: result.insertId }, '菜单创建成功');
  } catch (error) {
    fail(res, error.message);
  }
});

router.put('/menus/:id', requirePermission('menu.edit'), async (req, res) => {
  const missingField = requireBodyFields(req.body, ['name', 'menuKey', 'menuType', 'status', 'visible']);

  if (missingField) {
    return fail(res, `${missingField} 不能为空`, 400);
  }

  try {
    await query(
      `
        UPDATE menus
        SET parent_id = ?, name = ?, path = ?, component = ?, permission_code = ?, menu_key = ?, menu_type = ?, icon = ?, status = ?, visible = ?, sort_order = ?
        WHERE id = ?
      `,
      [
        req.body.parentId || null,
        req.body.name,
        req.body.path || '',
        req.body.component || '',
        req.body.permissionCode || '',
        req.body.menuKey,
        req.body.menuType,
        req.body.icon || '',
        req.body.status,
        req.body.visible,
        req.body.sortOrder || 0,
        req.params.id
      ]
    );

    ok(res, null, '菜单更新成功');
  } catch (error) {
    fail(res, error.message);
  }
});

router.delete('/menus/:id', requirePermission('menu.delete'), async (req, res) => {
  try {
    const children = await query('SELECT COUNT(*) AS total FROM menus WHERE parent_id = ?', [req.params.id]);

    if (children[0].total > 0) {
      return fail(res, '请先删除下级菜单', 400);
    }

    await query('DELETE FROM role_menus WHERE menu_id = ?', [req.params.id]);
    await query('DELETE FROM menus WHERE id = ?', [req.params.id]);
    ok(res, null, '菜单删除成功');
  } catch (error) {
    fail(res, error.message);
  }
});

router.get('/project-categories', requirePermission('project.view'), async (_req, res) => {
  try {
    const rows = await query(
      `
        SELECT
          id,
          category_key AS \`key\`,
          category_name AS label,
          sort_order AS sortOrder
        FROM project_categories
        ORDER BY sort_order ASC, id ASC
      `
    );

    ok(res, rows);
  } catch (error) {
    fail(res, error.message);
  }
});

router.get('/projects', requirePermission('project.view'), async (req, res) => {
  const keyword = req.query.keyword?.trim() || '';
  const category = req.query.category?.trim() || '';
  const status = req.query.status?.trim() || '';
  const auditStatus = req.query.auditStatus?.trim() || '';

  try {
    const conditions = [];
    const params = [];

    if (keyword) {
      conditions.push('p.title LIKE ?');
      params.push(`%${keyword}%`);
    }

    if (category && category !== 'all') {
      conditions.push('c.category_key = ?');
      params.push(category);
    }

    if (status) {
      conditions.push('p.status = ?');
      params.push(status);
    }

    if (auditStatus) {
      conditions.push('p.audit_status = ?');
      params.push(auditStatus);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = await query(
      `
        SELECT
          p.id,
          p.title,
          COALESCE(NULLIF(p.summary, ''), p.description) AS description,
          p.cover_image AS image,
          p.status,
          p.audit_status AS auditStatus,
          p.audit_comment AS auditComment,
          p.view_count AS viewCount,
          p.favorite_count AS favoriteCount,
          p.like_count AS likeCount,
          p.sort_order AS sortOrder,
          p.created_at AS createdAt,
          p.audited_at AS auditedAt,
          c.id AS categoryId,
          c.category_key AS category,
          c.category_name AS categoryLabel,
          su.nickname AS creatorName,
          au.name AS auditedByName
        FROM projects p
        INNER JOIN project_categories c ON c.id = p.category_id
        LEFT JOIN site_users su ON su.id = p.creator_user_id
        LEFT JOIN admin_users au ON au.id = p.audited_by
        ${whereClause}
        ORDER BY p.sort_order ASC, p.id DESC
      `,
      params
    );

    ok(res, rows);
  } catch (error) {
    fail(res, error.message);
  }
});

router.post('/projects', requirePermission('project.create'), async (req, res) => {
  const missingField = requireBodyFields(req.body, ['title', 'categoryId', 'image', 'status']);

  if (missingField) {
    return fail(res, `${missingField} 不能为空`, 400);
  }

  try {
    const nextAuditStatus = req.body.status === 'published' ? 'approved' : req.body.auditStatus || 'pending';
    const now = new Date();
    const result = await query(
      `
        INSERT INTO projects (
          title,
          description,
          summary,
          content,
          category_id,
          cover_image,
          status,
          audit_status,
          audit_comment,
          sort_order,
          audited_by,
          audited_at,
          published_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        req.body.title,
        req.body.description || '',
        req.body.description || '',
        req.body.content || '',
        req.body.categoryId,
        req.body.image,
        req.body.status,
        nextAuditStatus,
        req.body.auditComment || '',
        req.body.sortOrder || 0,
        nextAuditStatus === 'approved' ? req.auth.id : null,
        nextAuditStatus === 'approved' ? now : null,
        req.body.status === 'published' && nextAuditStatus === 'approved' ? now : null
      ]
    );

    await appendProjectAuditLog(
      result.insertId,
      nextAuditStatus === 'approved' ? 'approve' : 'submit',
      '',
      nextAuditStatus,
      req.body.auditComment || '',
      req.auth.id
    );

    ok(res, { id: result.insertId }, '项目创建成功');
  } catch (error) {
    fail(res, error.message);
  }
});

router.put('/projects/:id', requirePermission('project.edit'), async (req, res) => {
  const missingField = requireBodyFields(req.body, ['title', 'categoryId', 'image', 'status']);

  if (missingField) {
    return fail(res, `${missingField} 不能为空`, 400);
  }

  try {
    const currentRows = await query('SELECT audit_status FROM projects WHERE id = ? LIMIT 1', [req.params.id]);

    if (!currentRows.length) {
      return fail(res, '项目不存在', 404);
    }

    const nextAuditStatus = req.body.status === 'published' ? 'approved' : req.body.auditStatus || currentRows[0].audit_status;
    const now = new Date();

    await query(
      `
        UPDATE projects
        SET title = ?, description = ?, summary = ?, content = ?, category_id = ?, cover_image = ?, status = ?, audit_status = ?, audit_comment = ?, sort_order = ?, audited_by = ?, audited_at = ?, published_at = ?
        WHERE id = ?
      `,
      [
        req.body.title,
        req.body.description || '',
        req.body.description || '',
        req.body.content || '',
        req.body.categoryId,
        req.body.image,
        req.body.status,
        nextAuditStatus,
        req.body.auditComment || '',
        req.body.sortOrder || 0,
        nextAuditStatus === 'approved' ? req.auth.id : null,
        nextAuditStatus === 'approved' ? now : null,
        req.body.status === 'published' && nextAuditStatus === 'approved' ? now : null,
        req.params.id
      ]
    );

    ok(res, null, '项目更新成功');
  } catch (error) {
    fail(res, error.message);
  }
});

router.patch('/projects/:id/status', requirePermission('project.publish'), async (req, res) => {
  if (!req.body.status) {
    return fail(res, 'status 不能为空', 400);
  }

  try {
    await query('UPDATE projects SET status = ? WHERE id = ?', [req.body.status, req.params.id]);
    ok(res, null, '项目状态更新成功');
  } catch (error) {
    fail(res, error.message);
  }
});

router.post('/projects/:id/audit', requirePermission('project.audit'), async (req, res) => {
  const { action, comment = '' } = req.body;

  if (!['approve', 'reject'].includes(action)) {
    return fail(res, '无效的审核动作', 400);
  }

  try {
    const rows = await query(
      `
        SELECT id, audit_status AS auditStatus
        FROM projects
        WHERE id = ?
        LIMIT 1
      `,
      [req.params.id]
    );

    if (!rows.length) {
      return fail(res, '项目不存在', 404);
    }

    const nextAuditStatus = action === 'approve' ? 'approved' : 'rejected';
    const nextStatus = action === 'approve' ? 'published' : 'draft';
    const now = new Date();

    await query(
      `
        UPDATE projects
        SET audit_status = ?, audit_comment = ?, status = ?, audited_by = ?, audited_at = ?, published_at = ?
        WHERE id = ?
      `,
      [nextAuditStatus, comment, nextStatus, req.auth.id, now, action === 'approve' ? now : null, req.params.id]
    );

    await appendProjectAuditLog(req.params.id, action, rows[0].auditStatus, nextAuditStatus, comment, req.auth.id);

    ok(res, null, action === 'approve' ? '审核通过成功' : '审核驳回成功');
  } catch (error) {
    fail(res, error.message);
  }
});

router.delete('/projects/:id', requirePermission('project.delete'), async (req, res) => {
  try {
    await query('DELETE FROM projects WHERE id = ?', [req.params.id]);
    ok(res, null, '项目删除成功');
  } catch (error) {
    fail(res, error.message);
  }
});

export default router;
