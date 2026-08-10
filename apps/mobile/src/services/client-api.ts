import Taro from '@tarojs/taro';
import { clearClientToken, getClientToken } from '@/auth';
import { routes } from '@/constants/routes';
import { http } from './http';

export type ProjectCategory = 'all' | 'ai' | 'ecommerce' | 'tool' | 'content';

export type CategoryItem = {
  key: ProjectCategory;
  label: string;
};

export type ProjectItem = {
  id: number;
  title: string;
  category: Exclude<ProjectCategory, 'all'>;
  image: string;
  description: string;
};

export type ProjectDetail = {
  id: number;
  title: string;
  description: string;
  content: string;
  category: Exclude<ProjectCategory, 'all'>;
  categoryLabel: string;
  image: string;
  status: string;
  auditStatus: string;
  auditComment: string;
  viewCount: number;
  favoriteCount: number;
  likeCount: number;
  createdAt: string;
  authorName: string | null;
  isOwner: boolean;
  isFavorited: boolean;
  isLiked: boolean;
};

export type ClientUser = {
  id: number;
  nickname: string;
  phone: string;
  memberLevel: string;
  status: string;
};

export type ClientProfile = ClientUser & {
  stats: {
    publishedProjects: number;
    pendingProjects: number;
    totalFavorites: number;
    totalLikes: number;
  };
};

export type CaptchaPayload = {
  captchaId: string;
  svg: string;
};

export type UserProjectItem = {
  id: number;
  title: string;
  description: string;
  category: Exclude<ProjectCategory, 'all'>;
  categoryLabel: string;
  image: string;
  status: string;
  auditStatus: string;
  auditComment: string;
  viewCount: number;
  favoriteCount: number;
  likeCount: number;
  createdAt: string;
  authorName?: string | null;
  favoritedAt?: string;
};

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

const AUTH_REDIRECT_ERROR = '__AUTH_REDIRECT__';
let redirectingToAuth = false;

function redirectToAuth() {
  if (redirectingToAuth) {
    return;
  }

  redirectingToAuth = true;

  Taro.reLaunch({ url: routes.auth }).finally(() => {
    setTimeout(() => {
      redirectingToAuth = false;
    }, 300);
  });
}

export function isAuthRedirectError(error: unknown) {
  return error instanceof Error && error.message === AUTH_REDIRECT_ERROR;
}

async function clientRequest<T>(path: string, options: { method?: 'GET' | 'POST' | 'DELETE'; data?: unknown } = {}) {
  const token = getClientToken();

  try {
    const result = await http<ApiEnvelope<T>>({
      path,
      method: options.method || 'GET',
      data: options.data,
      header: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });

    return result.data;
  } catch (error) {
    if (error instanceof Error && /401/.test(error.message) && token) {
      clearClientToken();
      redirectToAuth();
      throw new Error(AUTH_REDIRECT_ERROR);
    }

    throw error;
  }
}

export function fetchCategories() {
  return clientRequest<CategoryItem[]>('/categories');
}

export function fetchProjects(params: { keyword?: string; category?: string }) {
  const search = new URLSearchParams();

  if (params.keyword) {
    search.set('keyword', params.keyword);
  }

  if (params.category) {
    search.set('category', params.category);
  }

  const query = search.toString();
  return clientRequest<ProjectItem[]>(`/projects${query ? `?${query}` : ''}`);
}

export function fetchProjectDetail(id: string) {
  return clientRequest<ProjectDetail>(`/projects/${id}`);
}

export function fetchClientCaptcha() {
  return clientRequest<CaptchaPayload>('/auth/captcha');
}

export function loginClientUser(payload: {
  phone: string;
  password: string;
  captchaId: string;
  captchaCode: string;
}) {
  return clientRequest<{ token: string; user: ClientUser }>('/auth/login', {
    method: 'POST',
    data: payload
  });
}

export function registerClientUser(payload: {
  nickname: string;
  phone: string;
  password: string;
  captchaId: string;
  captchaCode: string;
}) {
  return clientRequest<{ token: string; user: ClientUser }>('/auth/register', {
    method: 'POST',
    data: payload
  });
}

export function fetchCurrentClientUser() {
  return clientRequest<ClientUser>('/auth/current-user');
}

export function fetchClientProfile() {
  return clientRequest<ClientProfile>('/users/me/profile');
}

export function fetchMyProjects() {
  return clientRequest<UserProjectItem[]>('/users/me/projects');
}

export function fetchMyFavorites() {
  return clientRequest<UserProjectItem[]>('/users/me/favorites');
}

export function changeClientPassword(payload: { oldPassword: string; newPassword: string }) {
  return clientRequest<null>('/auth/change-password', {
    method: 'POST',
    data: payload
  });
}

export function publishProject(payload: {
  title: string;
  summary: string;
  details: string;
  category: Exclude<ProjectCategory, 'all'>;
}) {
  return clientRequest<{ id: number }>('/projects', {
    method: 'POST',
    data: payload
  });
}

export function favoriteProject(id: number) {
  return clientRequest<null>(`/projects/${id}/favorite`, { method: 'POST' });
}

export function unfavoriteProject(id: number) {
  return clientRequest<null>(`/projects/${id}/favorite`, { method: 'DELETE' });
}

export function likeProject(id: number) {
  return clientRequest<null>(`/projects/${id}/like`, { method: 'POST' });
}

export function unlikeProject(id: number) {
  return clientRequest<null>(`/projects/${id}/like`, { method: 'DELETE' });
}
