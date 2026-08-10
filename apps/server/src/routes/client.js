import { Router } from 'express';
import crypto from 'crypto';
import { query } from '../db.js';
import { hashPassword, signToken, verifyPassword, verifyToken } from '../utils/auth.js';
import { ok, fail } from '../utils/response.js';

const router = Router();
const captchaStore = new Map();
const projectFallbackImages = {
  ai: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=900&q=80',
  ecommerce: 'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=900&q=80',
  tool: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
  content: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=900&q=80'
};

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
      <path d="M8 32 C24 10, 40 42, 58 18 S92 8, 124 26" stroke="#bfdbfe" stroke-width="3" fill="none" />
      <path d="M14 10 C28 28, 48 4, 72 20 S108 42, 124 12" stroke="#fdba74" stroke-width="3" fill="none" />
      <g font-family="Verdana, sans-serif" font-weight="700">${chars}</g>
    </svg>
  `.trim();
}

function verifyCaptcha(captchaId, captchaCode) {
  const captchaRecord = captchaStore.get(captchaId);

  if (!captchaRecord || captchaRecord.expiresAt < Date.now()) {
    return '验证码已过期，请刷新后重试';
  }

  if ((captchaCode || '').trim().toUpperCase() !== captchaRecord.text) {
    return '验证码错误';
  }

  captchaStore.delete(captchaId);
  return null;
}

async function getSiteUserDetail(userId) {
  const rows = await query(
    `
      SELECT
        id,
        nickname,
        phone,
        member_level AS memberLevel,
        status
      FROM site_users
      WHERE id = ?
      LIMIT 1
    `,
    [userId]
  );

  return rows[0] || null;
}

async function getProjectById(projectId) {
  const rows = await query(
    `
      SELECT
        p.id,
        p.title,
        COALESCE(NULLIF(p.summary, ''), p.description) AS description,
        p.content,
        c.category_key AS category,
        c.category_name AS categoryLabel,
        p.cover_image AS image,
        p.status,
        p.audit_status AS auditStatus,
        p.audit_comment AS auditComment,
        p.view_count AS viewCount,
        p.favorite_count AS favoriteCount,
        p.like_count AS likeCount,
        p.creator_user_id AS creatorUserId,
        p.created_at AS createdAt,
        su.nickname AS authorName
      FROM projects p
      INNER JOIN project_categories c ON c.id = p.category_id
      LEFT JOIN site_users su ON su.id = p.creator_user_id
      WHERE p.id = ?
      LIMIT 1
    `,
    [projectId]
  );

  return rows[0] || null;
}

async function getProjectInteractionState(projectId, userId) {
  const [favoriteRows, likeRows] = await Promise.all([
    query('SELECT id FROM project_favorites WHERE project_id = ? AND user_id = ? LIMIT 1', [projectId, userId]),
    query('SELECT id FROM project_likes WHERE project_id = ? AND user_id = ? LIMIT 1', [projectId, userId])
  ]);

  return {
    isFavorited: favoriteRows.length > 0,
    isLiked: likeRows.length > 0
  };
}

async function trackProjectView(projectId, userId) {
  try {
    const latestRows = await query(
      `
        SELECT id
        FROM project_views
        WHERE project_id = ? AND user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 MINUTE)
        ORDER BY id DESC
        LIMIT 1
      `,
      [projectId, userId]
    );

    if (latestRows.length) {
      return;
    }

    await query('INSERT INTO project_views (project_id, user_id) VALUES (?, ?)', [projectId, userId]);
    await query('UPDATE projects SET view_count = view_count + 1 WHERE id = ?', [projectId]);
  } catch (_error) {
    // Ignore view tracking failures to avoid breaking detail page rendering.
  }
}

async function authMiddleware(req, res, next) {
  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';

  if (!token) {
    return fail(res, '请先登录', 401);
  }

  try {
    const payload = verifyToken(token);
    const currentUser = await getSiteUserDetail(payload.siteUserId);

    if (!currentUser) {
      return fail(res, '当前用户不存在', 401);
    }

    req.auth = currentUser;
    next();
  } catch (_error) {
    return fail(res, '登录已失效，请重新登录', 401);
  }
}

router.get('/categories', async (_req, res) => {
  try {
    const rows = await query(
      'SELECT category_key AS `key`, category_name AS label FROM project_categories ORDER BY sort_order ASC, id ASC'
    );

    ok(res, [{ key: 'all', label: '全部项目' }, ...rows]);
  } catch (error) {
    fail(res, error.message);
  }
});

router.get('/projects', async (req, res) => {
  const keyword = req.query.keyword?.trim() || '';
  const category = req.query.category?.trim() || '';

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

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = await query(
      `
        SELECT
          p.id,
          p.title,
          c.category_key AS category,
          p.cover_image AS image,
          COALESCE(NULLIF(p.summary, ''), p.description) AS description
        FROM projects p
        INNER JOIN project_categories c ON c.id = p.category_id
        ${whereClause ? `${whereClause} AND p.status = 'published' AND p.audit_status = 'approved'` : "WHERE p.status = 'published' AND p.audit_status = 'approved'"}
        ORDER BY p.id DESC
      `,
      params
    );

    ok(res, rows);
  } catch (error) {
    fail(res, error.message);
  }
});

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

router.post('/auth/register', async (req, res) => {
  const { phone, password, nickname, captchaId, captchaCode } = req.body;

  if (!phone || !password || !nickname) {
    return fail(res, '请填写手机号、昵称和密码', 400);
  }

  const captchaError = verifyCaptcha(captchaId, captchaCode);

  if (captchaError) {
    return fail(res, captchaError, 400);
  }

  try {
    const existed = await query('SELECT id FROM site_users WHERE phone = ? LIMIT 1', [phone]);

    if (existed.length) {
      return fail(res, '该手机号已注册', 400);
    }

    const result = await query(
      `
        INSERT INTO site_users (nickname, phone, password, member_level, status)
        VALUES (?, ?, ?, '普通会员', '正常')
      `,
      [nickname, phone, hashPassword(password)]
    );

    const user = await getSiteUserDetail(result.insertId);
    ok(
      res,
      {
        token: signToken({ siteUserId: result.insertId }),
        user
      },
      '注册成功'
    );
  } catch (error) {
    fail(res, error.message);
  }
});

router.post('/auth/login', async (req, res) => {
  const { phone, password, captchaId, captchaCode } = req.body;

  if (!phone || !password) {
    return fail(res, '请输入手机号和密码', 400);
  }

  const captchaError = verifyCaptcha(captchaId, captchaCode);

  if (captchaError) {
    return fail(res, captchaError, 400);
  }

  try {
    const rows = await query(
      `
        SELECT
          id,
          password,
          status
        FROM site_users
        WHERE phone = ?
        LIMIT 1
      `,
      [phone]
    );

    if (!rows.length || !verifyPassword(password, rows[0].password)) {
      return fail(res, '手机号或密码错误', 401);
    }

    if (rows[0].status !== '正常') {
      return fail(res, '当前账号状态不可登录', 403);
    }

    const user = await getSiteUserDetail(rows[0].id);
    ok(
      res,
      {
        token: signToken({ siteUserId: rows[0].id }),
        user
      },
      '登录成功'
    );
  } catch (error) {
    fail(res, error.message);
  }
});

router.get('/auth/current-user', authMiddleware, async (req, res) => {
  ok(res, req.auth);
});

router.get('/users/me/profile', authMiddleware, async (req, res) => {
  try {
    const [statsRows] = await Promise.all([
      query(
        `
          SELECT
            COUNT(*) AS publishedProjects,
            SUM(CASE WHEN audit_status = 'pending' THEN 1 ELSE 0 END) AS pendingProjects,
            COALESCE(SUM(favorite_count), 0) AS totalFavorites,
            COALESCE(SUM(like_count), 0) AS totalLikes
          FROM projects
          WHERE creator_user_id = ?
        `,
        [req.auth.id]
      )
    ]);

    ok(res, {
      ...req.auth,
      stats: {
        publishedProjects: Number(statsRows[0]?.publishedProjects || 0),
        pendingProjects: Number(statsRows[0]?.pendingProjects || 0),
        totalFavorites: Number(statsRows[0]?.totalFavorites || 0),
        totalLikes: Number(statsRows[0]?.totalLikes || 0)
      }
    });
  } catch (error) {
    fail(res, error.message);
  }
});

router.get('/users/me/projects', authMiddleware, async (req, res) => {
  try {
    const rows = await query(
      `
        SELECT
          p.id,
          p.title,
          COALESCE(NULLIF(p.summary, ''), p.description) AS description,
          c.category_key AS category,
          c.category_name AS categoryLabel,
          p.cover_image AS image,
          p.status,
          p.audit_status AS auditStatus,
          p.audit_comment AS auditComment,
          p.view_count AS viewCount,
          p.favorite_count AS favoriteCount,
          p.like_count AS likeCount,
          p.created_at AS createdAt
        FROM projects p
        INNER JOIN project_categories c ON c.id = p.category_id
        WHERE p.creator_user_id = ?
        ORDER BY p.id DESC
      `,
      [req.auth.id]
    );

    ok(res, rows);
  } catch (error) {
    fail(res, error.message);
  }
});

router.get('/users/me/favorites', authMiddleware, async (req, res) => {
  try {
    const rows = await query(
      `
        SELECT
          p.id,
          p.title,
          COALESCE(NULLIF(p.summary, ''), p.description) AS description,
          c.category_key AS category,
          c.category_name AS categoryLabel,
          p.cover_image AS image,
          p.status,
          p.audit_status AS auditStatus,
          p.audit_comment AS auditComment,
          p.view_count AS viewCount,
          p.favorite_count AS favoriteCount,
          p.like_count AS likeCount,
          pf.created_at AS favoritedAt,
          p.created_at AS createdAt,
          su.nickname AS authorName
        FROM project_favorites pf
        INNER JOIN projects p ON p.id = pf.project_id
        INNER JOIN project_categories c ON c.id = p.category_id
        LEFT JOIN site_users su ON su.id = p.creator_user_id
        WHERE pf.user_id = ? AND p.status = 'published' AND p.audit_status = 'approved'
        ORDER BY pf.id DESC
      `,
      [req.auth.id]
    );

    ok(res, rows);
  } catch (error) {
    fail(res, error.message);
  }
});

router.post('/auth/change-password', authMiddleware, async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return fail(res, '请输入原密码和新密码', 400);
  }

  try {
    const rows = await query('SELECT password FROM site_users WHERE id = ? LIMIT 1', [req.auth.id]);

    if (!rows.length || !verifyPassword(oldPassword, rows[0].password)) {
      return fail(res, '原密码错误', 400);
    }

    await query('UPDATE site_users SET password = ? WHERE id = ?', [hashPassword(newPassword), req.auth.id]);
    ok(res, null, '密码修改成功');
  } catch (error) {
    fail(res, error.message);
  }
});

router.get('/projects/:id', authMiddleware, async (req, res) => {
  try {
    const project = await getProjectById(req.params.id);

    if (!project) {
      return fail(res, '项目不存在', 404);
    }

    const isOwner = Number(project.creatorUserId) === Number(req.auth.id);
    const canView = project.status === 'published' && project.auditStatus === 'approved';

    if (!canView && !isOwner) {
      return fail(res, '项目暂未公开', 403);
    }

    await trackProjectView(project.id, req.auth.id);
    const interactionState = await getProjectInteractionState(project.id, req.auth.id);

    ok(res, {
      ...project,
      isOwner,
      ...interactionState
    });
  } catch (error) {
    fail(res, error.message);
  }
});

router.post('/projects/:id/favorite', authMiddleware, async (req, res) => {
  try {
    const project = await getProjectById(req.params.id);

    if (!project || project.status !== 'published' || project.auditStatus !== 'approved') {
      return fail(res, '项目暂不可收藏', 404);
    }

    await query(
      'INSERT IGNORE INTO project_favorites (project_id, user_id) VALUES (?, ?)',
      [req.params.id, req.auth.id]
    );
    await query(
      `
        UPDATE projects
        SET favorite_count = (
          SELECT COUNT(*) FROM project_favorites WHERE project_id = ?
        )
        WHERE id = ?
      `,
      [req.params.id, req.params.id]
    );

    ok(res, null, '已收藏');
  } catch (error) {
    fail(res, error.message);
  }
});

router.delete('/projects/:id/favorite', authMiddleware, async (req, res) => {
  try {
    await query('DELETE FROM project_favorites WHERE project_id = ? AND user_id = ?', [req.params.id, req.auth.id]);
    await query(
      `
        UPDATE projects
        SET favorite_count = (
          SELECT COUNT(*) FROM project_favorites WHERE project_id = ?
        )
        WHERE id = ?
      `,
      [req.params.id, req.params.id]
    );

    ok(res, null, '已取消收藏');
  } catch (error) {
    fail(res, error.message);
  }
});

router.post('/projects/:id/like', authMiddleware, async (req, res) => {
  try {
    const project = await getProjectById(req.params.id);

    if (!project || project.status !== 'published' || project.auditStatus !== 'approved') {
      return fail(res, '项目暂不可点赞', 404);
    }

    await query(
      'INSERT IGNORE INTO project_likes (project_id, user_id) VALUES (?, ?)',
      [req.params.id, req.auth.id]
    );
    await query(
      `
        UPDATE projects
        SET like_count = (
          SELECT COUNT(*) FROM project_likes WHERE project_id = ?
        )
        WHERE id = ?
      `,
      [req.params.id, req.params.id]
    );

    ok(res, null, '已点赞');
  } catch (error) {
    fail(res, error.message);
  }
});

router.delete('/projects/:id/like', authMiddleware, async (req, res) => {
  try {
    await query('DELETE FROM project_likes WHERE project_id = ? AND user_id = ?', [req.params.id, req.auth.id]);
    await query(
      `
        UPDATE projects
        SET like_count = (
          SELECT COUNT(*) FROM project_likes WHERE project_id = ?
        )
        WHERE id = ?
      `,
      [req.params.id, req.params.id]
    );

    ok(res, null, '已取消点赞');
  } catch (error) {
    fail(res, error.message);
  }
});

router.post('/projects', authMiddleware, async (req, res) => {
  const { title, summary, details, category } = req.body;

  if (!title || !summary || !category) {
    return fail(res, '请至少填写标题、项目方向和一句话想法', 400);
  }

  try {
    const categories = await query(
      'SELECT id, category_key FROM project_categories WHERE category_key = ? LIMIT 1',
      [category]
    );

    if (!categories.length) {
      return fail(res, '项目方向不存在', 400);
    }

    const result = await query(
      `
        INSERT INTO projects (
          title,
          description,
          summary,
          content,
          category_id,
          cover_image,
          creator_user_id,
          status,
          audit_status,
          audit_comment,
          sort_order
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', 'pending', '', 0)
      `,
      [
        title,
        summary,
        summary,
        details || '',
        categories[0].id,
        projectFallbackImages[category] || projectFallbackImages.tool,
        req.auth.id
      ]
    );

    ok(res, { id: result.insertId }, '项目已提交审核');
  } catch (error) {
    fail(res, error.message);
  }
});

export default router;
