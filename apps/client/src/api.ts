import { clearClientToken, getClientToken } from './auth';
import { demoRequest } from './demo-api';

export const IS_DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
const API_BASE_URL = import.meta.env.VITE_CLIENT_API_BASE_URL || '/api/client';

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

async function request<T>(path: string, options?: RequestInit) {
  if (IS_DEMO_MODE) {
    return demoRequest<T>(path, options);
  }

  const token = getClientToken();
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options?.headers as Record<string, string> | undefined) || {})
  };

  if (options?.body) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });
  const result = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 && token) {
      clearClientToken();
      const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      const search = new URLSearchParams();

      if (currentPath && currentPath !== '/auth') {
        search.set('redirect', currentPath);
      }

      window.location.replace(`/auth${search.toString() ? `?${search.toString()}` : ''}`);
    }

    throw new Error(result?.message || `Request failed: ${response.status}`);
  }

  return result.data as T;
}

export function fetchCategories() {
  return request<CategoryItem[]>('/categories');
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
  return request<ProjectItem[]>(`/projects${query ? `?${query}` : ''}`);
}

export function fetchProjectDetail(id: string) {
  return request<ProjectDetail>(`/projects/${id}`);
}

export function fetchClientCaptcha() {
  return request<CaptchaPayload>('/auth/captcha');
}

export function registerClientUser(payload: {
  nickname: string;
  phone: string;
  password: string;
  captchaId: string;
  captchaCode: string;
}) {
  return request<{ token: string; user: ClientUser }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function loginClientUser(payload: {
  phone: string;
  password: string;
  captchaId: string;
  captchaCode: string;
}) {
  return request<{ token: string; user: ClientUser }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function fetchCurrentClientUser() {
  return request<ClientUser>('/auth/current-user');
}

export function fetchClientProfile() {
  return request<ClientProfile>('/users/me/profile');
}

export function fetchMyProjects() {
  return request<UserProjectItem[]>('/users/me/projects');
}

export function fetchMyFavorites() {
  return request<UserProjectItem[]>('/users/me/favorites');
}

export function changeClientPassword(payload: { oldPassword: string; newPassword: string }) {
  return request<null>('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function publishProject(payload: {
  title: string;
  summary: string;
  details: string;
  category: Exclude<ProjectCategory, 'all'>;
}) {
  return request<{ id: number }>('/projects', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function favoriteProject(id: number) {
  return request<null>(`/projects/${id}/favorite`, {
    method: 'POST'
  });
}

export function unfavoriteProject(id: number) {
  return request<null>(`/projects/${id}/favorite`, {
    method: 'DELETE'
  });
}

export function likeProject(id: number) {
  return request<null>(`/projects/${id}/like`, {
    method: 'POST'
  });
}

export function unlikeProject(id: number) {
  return request<null>(`/projects/${id}/like`, {
    method: 'DELETE'
  });
}
