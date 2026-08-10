import type {
  CaptchaPayload,
  CategoryItem,
  ClientProfile,
  ClientUser,
  ProjectCategory,
  ProjectDetail,
  ProjectItem,
  UserProjectItem
} from './api';

type DemoProject = Omit<ProjectDetail, 'isFavorited' | 'isLiked'>;
type DemoState = { projects: DemoProject[]; favoriteIds: number[]; likedIds: number[] };

const STORAGE_KEY = 'product-ideas-hub-demo-state-v1';
const categoryLabels: Record<Exclude<ProjectCategory, 'all'>, string> = {
  ai: 'AI 应用',
  ecommerce: '电商零售',
  tool: '效率工具',
  content: '内容社区'
};

const categories: CategoryItem[] = [
  { key: 'all', label: '全部' },
  ...Object.entries(categoryLabels).map(([key, label]) => ({
    key: key as Exclude<ProjectCategory, 'all'>,
    label
  }))
];

const demoUser: ClientUser = {
  id: 1,
  nickname: '演示创作者',
  phone: '13800000001',
  memberLevel: '体验会员',
  status: '正常'
};

function project(
  id: number,
  title: string,
  description: string,
  category: Exclude<ProjectCategory, 'all'>,
  image: string,
  metrics: [number, number, number],
  options: Partial<DemoProject> = {}
): DemoProject {
  return {
    id,
    title,
    description,
    content: `${description} 该项目聚焦真实使用场景，并提供从想法验证到 MVP 落地的完整思路。`,
    category,
    categoryLabel: categoryLabels[category],
    image,
    status: 'published',
    auditStatus: 'approved',
    auditComment: '',
    viewCount: metrics[0],
    favoriteCount: metrics[1],
    likeCount: metrics[2],
    createdAt: `2026-07-${String(16 + id * 3).padStart(2, '0')}T10:00:00+08:00`,
    authorName: 'IdeaHub 社区',
    isOwner: false,
    ...options
  };
}

const seedProjects: DemoProject[] = [
  project(1, 'AI 商业计划生成器', '自动生成创业项目的商业计划书和财务预测。', 'ai', 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=900&q=80', [328, 46, 89]),
  project(2, '跨境选品雷达', '围绕跨境电商场景的趋势选品和竞品分析平台。', 'ecommerce', 'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=900&q=80', [271, 37, 64]),
  project(3, '团队任务节奏板', '给团队做排期、看板和节奏回顾的轻量工具。', 'tool', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80', [193, 25, 48]),
  project(4, '创作者选题池', '面向内容团队的选题整理、复盘和素材沉淀系统。', 'content', 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=900&q=80', [246, 41, 72]),
  project(5, '智能客服知识台', '支持知识库检索、问答和工单协同的 AI 客服中心。', 'ai', 'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?auto=format&fit=crop&w=900&q=80', [219, 32, 57]),
  project(6, '私域活动排期器', '私域活动编排、投放和复盘的一体化工作台。', 'tool', 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=900&q=80', [18, 0, 0], {
    status: 'draft',
    auditStatus: 'pending',
    createdAt: '2026-08-08T15:00:00+08:00',
    authorName: demoUser.nickname,
    isOwner: true
  })
];

function initialState(): DemoState {
  return { projects: seedProjects.map((item) => ({ ...item })), favoriteIds: [1, 4], likedIds: [1, 5] };
}

function loadState(): DemoState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as DemoState) : initialState();
  } catch {
    return initialState();
  }
}

let state = loadState();

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // The demo continues in memory when browser storage is unavailable.
  }
}

function bodyOf(options?: RequestInit) {
  return options?.body && typeof options.body === 'string'
    ? (JSON.parse(options.body) as Record<string, string>)
    : {};
}

function findProject(id: number) {
  return state.projects.find((item) => item.id === id);
}

function detailOf(item: DemoProject): ProjectDetail {
  return {
    ...item,
    isFavorited: state.favoriteIds.includes(item.id),
    isLiked: state.likedIds.includes(item.id)
  };
}

function userProjectOf(item: DemoProject): UserProjectItem {
  return {
    ...item,
    ...(state.favoriteIds.includes(item.id) ? { favoritedAt: new Date().toISOString() } : {})
  };
}

function toggleAction(id: number, action: 'favorite' | 'like', enabled: boolean) {
  const item = findProject(id);
  if (!item || item.auditStatus !== 'approved') throw new Error('当前项目不可操作');

  const ids = action === 'favorite' ? state.favoriteIds : state.likedIds;
  const exists = ids.includes(id);
  if (enabled === exists) return;

  const nextIds = enabled ? [...ids, id] : ids.filter((itemId) => itemId !== id);
  if (action === 'favorite') {
    state.favoriteIds = nextIds;
    item.favoriteCount = Math.max(0, item.favoriteCount + (enabled ? 1 : -1));
  } else {
    state.likedIds = nextIds;
    item.likeCount = Math.max(0, item.likeCount + (enabled ? 1 : -1));
  }
  saveState();
}

export async function demoRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const method = (options?.method || 'GET').toUpperCase();
  const url = new URL(path, window.location.origin);
  const pathname = url.pathname;

  if (method === 'GET' && pathname === '/categories') return categories as T;

  if (method === 'GET' && pathname === '/projects') {
    const keyword = (url.searchParams.get('keyword') || '').trim().toLowerCase();
    const category = url.searchParams.get('category');
    const result: ProjectItem[] = state.projects
      .filter((item) => item.auditStatus === 'approved')
      .filter((item) => !category || category === 'all' || item.category === category)
      .filter((item) => !keyword || `${item.title} ${item.description}`.toLowerCase().includes(keyword))
      .map(({ id, title, category: itemCategory, image, description }) => ({ id, title, category: itemCategory, image, description }));
    return result as T;
  }

  if (method === 'GET' && pathname === '/auth/captcha') {
    const captcha: CaptchaPayload = {
      captchaId: 'demo-captcha',
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="42"><rect width="120" height="42" rx="8" fill="#eff6ff"/><path d="M5 31L115 10M8 8L108 35" stroke="#bfdbfe"/><text x="19" y="29" font-size="22" font-family="monospace" font-weight="700" fill="#1d4ed8" letter-spacing="5">2468</text></svg>'
    };
    return captcha as T;
  }

  if (method === 'POST' && (pathname === '/auth/login' || pathname === '/auth/register')) {
    return { token: 'demo-browser-session', user: demoUser } as T;
  }
  if (method === 'GET' && pathname === '/auth/current-user') return demoUser as T;

  if (method === 'GET' && pathname === '/users/me/profile') {
    const own = state.projects.filter((item) => item.isOwner);
    const profile: ClientProfile = {
      ...demoUser,
      stats: {
        publishedProjects: own.filter((item) => item.auditStatus === 'approved').length,
        pendingProjects: own.filter((item) => item.auditStatus === 'pending').length,
        totalFavorites: state.favoriteIds.length,
        totalLikes: state.likedIds.length
      }
    };
    return profile as T;
  }
  if (method === 'GET' && pathname === '/users/me/projects') return state.projects.filter((item) => item.isOwner).map(userProjectOf) as T;
  if (method === 'GET' && pathname === '/users/me/favorites') return state.projects.filter((item) => state.favoriteIds.includes(item.id)).map(userProjectOf) as T;
  if (method === 'POST' && pathname === '/auth/change-password') return null as T;

  if (method === 'POST' && pathname === '/projects') {
    const body = bodyOf(options);
    if (!body.title?.trim() || !body.summary?.trim() || !body.details?.trim()) {
      throw new Error('请填写项目标题、一句话想法和展开描述');
    }
    const category = body.category as Exclude<ProjectCategory, 'all'>;
    const id = Math.max(...state.projects.map((item) => item.id), 0) + 1;
    state.projects.unshift(project(id, body.title.trim(), body.summary.trim(), category, 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80', [0, 0, 0], {
      content: body.details.trim(),
      status: 'draft',
      auditStatus: 'pending',
      createdAt: new Date().toISOString(),
      authorName: demoUser.nickname,
      isOwner: true
    }));
    saveState();
    return { id } as T;
  }

  const favorite = pathname.match(/^\/projects\/(\d+)\/favorite$/);
  if (favorite && (method === 'POST' || method === 'DELETE')) {
    toggleAction(Number(favorite[1]), 'favorite', method === 'POST');
    return null as T;
  }
  const like = pathname.match(/^\/projects\/(\d+)\/like$/);
  if (like && (method === 'POST' || method === 'DELETE')) {
    toggleAction(Number(like[1]), 'like', method === 'POST');
    return null as T;
  }
  const detail = pathname.match(/^\/projects\/(\d+)$/);
  if (method === 'GET' && detail) {
    const item = findProject(Number(detail[1]));
    if (!item) throw new Error('项目不存在');
    item.viewCount += 1;
    saveState();
    return detailOf(item) as T;
  }

  throw new Error(`演示模式暂不支持：${method} ${pathname}`);
}
