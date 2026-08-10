import { clearAdminToken, getAdminToken } from './auth';

const API_BASE_URL = '/api/admin';

export type PageParams = {
  page?: number;
  pageSize?: number;
};

export type PageResult<T> = {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
};

function appendPageParams(search: URLSearchParams, params?: PageParams) {
  if (params?.page != null) {
    search.set('page', String(params.page));
  }

  if (params?.pageSize != null) {
    search.set('pageSize', String(params.pageSize));
  }
}

export type DashboardStats = {
  systemUsers: number;
  roles: number;
  siteUsers: number;
  projects: number;
};

export type CurrentAdmin = {
  id: number;
  name: string;
  account?: string;
  phone?: string;
  email?: string;
  avatar?: string;
  role: string;
  roles: string[];
  roleIds: number[];
  departmentId?: number | null;
  departmentName?: string | null;
  status?: string;
  permissions: string[];
  menuIds: number[];
  menus: AdminMenuItem[];
};

export type AdminProfile = {
  id: number;
  name: string;
  account: string;
  phone: string;
  email: string;
  avatar: string;
  role: string;
  roles: string[];
  departmentName: string | null;
  status: string;
  createdAt: string | null;
};

export type AdminDeviceSession = {
  id: number;
  deviceType: string;
  deviceName: string;
  browser: string;
  os: string;
  ipAddress: string;
  isCurrent: boolean;
  status: string;
  lastActiveAt: string | null;
  createdAt: string | null;
};

export type AdminIntegration = {
  id: number;
  appKey: string;
  appName: string;
  appType: string;
  description: string;
  status: string;
  icon: string;
  accountName: string | null;
  boundAt: string | null;
  isBound: boolean;
};

export type SystemUser = {
  id: number;
  name: string;
  account: string;
  departmentId: number | null;
  departmentName: string | null;
  roleIds: number[];
  roles: string[];
  status: string;
};

export type DepartmentItem = {
  id: number;
  parentId: number | null;
  name: string;
  phone: string;
  email: string;
  status: '启用' | '停用';
  sortOrder: number;
  leaders: Array<{
    adminUserId: number;
    name: string;
    phone: string;
    email: string;
    isPrimary: boolean;
  }>;
  leaderDisplay: string;
  primaryLeaderName: string | null;
  children?: DepartmentItem[];
};

export type DepartmentUserOption = {
  id: number;
  name: string;
  account: string;
  departmentId: number | null;
  status: '启用' | '停用';
};

export type RoleItem = {
  id: number;
  name: string;
  members: number;
  scope: string;
  status: '启用' | '停用';
};

export type RoleDetail = {
  id: number;
  name: string;
  scope: string;
  status: '启用' | '停用';
  permissionIds: number[];
  menuIds: number[];
};

export type AuthorizationTreeNode = {
  id: number | string;
  key: string;
  title: string;
  nodeType: 'menu' | 'permission' | 'group';
  permissionCode?: string;
  children: AuthorizationTreeNode[];
};

export type AdminMenuItem = {
  id: number;
  parentId: number | null;
  name: string;
  path: string;
  component: string;
  permissionCode: string;
  menuKey: string;
  menuType: 'directory' | 'menu' | 'button';
  icon: string;
  status: '启用' | '停用';
  visible: '显示' | '隐藏';
  sortOrder: number;
  sourceType?: 'menu' | 'permission';
  groupName?: string;
  children: AdminMenuItem[];
};

export type SiteUser = {
  id: number;
  nickname: string;
  phone: string;
  level: string;
  status: '正常' | '冻结';
};

export type ProjectCategoryOption = {
  id: number;
  key: string;
  label: string;
  sortOrder: number;
};

export type ProjectItem = {
  id: number;
  title: string;
  description: string;
  image: string;
  status: string;
  auditStatus: string;
  auditComment: string;
  viewCount: number;
  favoriteCount: number;
  likeCount: number;
  sortOrder: number;
  createdAt: string;
  auditedAt: string | null;
  categoryId: number;
  category: string;
  categoryLabel: string;
  creatorName: string | null;
  auditedByName: string | null;
};

export type PermissionGroup = {
  key: string;
  name: string;
  permissions: Array<{
    id: number;
    code: string;
  }>;
};

export type DictTypeItem = {
  id: number;
  name: string;
  code: string;
  valueType: '字符串' | '数字' | '布尔';
  status: '启用' | '停用';
  itemCount: number;
  sortOrder: number;
  remark: string;
};

export type DictDataItem = {
  id: number;
  dictTypeId: number;
  parentId: number | null;
  label: string;
  value: string;
  status: '启用' | '停用';
  sortOrder: number;
  remark: string;
  children?: DictDataItem[];
};

export type CaptchaPayload = {
  captchaId: string;
  svg: string;
};

async function request<T>(path: string, options?: RequestInit) {
  const token = getAdminToken();
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
      clearAdminToken();
      const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      const search = new URLSearchParams();

      if (currentPath && currentPath !== '/login') {
        search.set('redirect', currentPath);
      }

      window.location.replace(`/login${search.toString() ? `?${search.toString()}` : ''}`);
    }
    throw new Error(result?.message || `Request failed: ${response.status}`);
  }

  return result.data as T;
}

export const fetchCaptcha = () => request<CaptchaPayload>('/auth/captcha');
export const loginAdmin = (payload: {
  account: string;
  password: string;
  captchaId: string;
  captchaCode: string;
}) =>
  request<{ token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
export const logoutAdmin = () =>
  request<null>('/auth/logout', {
    method: 'POST'
  });
export const fetchDashboardStats = () => request<DashboardStats>('/dashboard');
export const fetchCurrentAdmin = () => request<CurrentAdmin>('/current-admin');
export const fetchAdminProfile = () => request<AdminProfile>('/profile');
export const updateAdminProfile = (payload: { name: string; phone: string; email: string; avatar?: string }) =>
  request<null>('/profile', {
    method: 'PUT',
    body: JSON.stringify(payload)
  });

export const uploadAdminImage = async (file: File) => {
  const token = getAdminToken();
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/upload/image`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 && token) {
      clearAdminToken();
      const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      const search = new URLSearchParams();

      if (currentPath && currentPath !== '/login') {
        search.set('redirect', currentPath);
      }

      window.location.replace(`/login${search.toString() ? `?${search.toString()}` : ''}`);
    }
    throw new Error(result?.message || `Request failed: ${response.status}`);
  }

  return result.data as { url: string };
};
export const changeAdminPassword = (payload: { oldPassword: string; newPassword: string }) =>
  request<null>('/profile/change-password', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
export const fetchAdminPreferences = () => request<{ colorPrimary: string; showPageTabs: boolean; compactContent: boolean }>('/profile/preferences');
export const updateAdminPreferences = (payload: { colorPrimary: string; showPageTabs: boolean; compactContent: boolean }) =>
  request<{ colorPrimary: string; showPageTabs: boolean; compactContent: boolean }>('/profile/preferences', {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
export const fetchAdminDevices = () => request<AdminDeviceSession[]>('/profile/devices');
export const offlineAdminDevice = (id: number) =>
  request<null>(`/profile/devices/${id}`, {
    method: 'DELETE'
  });
export const fetchAdminIntegrations = () => request<AdminIntegration[]>('/profile/integrations');
export const bindAdminIntegration = (id: number, payload: { accountName: string }) =>
  request<null>(`/profile/integrations/${id}/bind`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
export const unbindAdminIntegration = (id: number) =>
  request<null>(`/profile/integrations/${id}/bind`, {
    method: 'DELETE'
  });
export const fetchSystemUsers = (params?: { keyword?: string; status?: string } & PageParams) => {
  const search = new URLSearchParams();

  if (params?.keyword) {
    search.set('keyword', params.keyword);
  }

  if (params?.status) {
    search.set('status', params.status);
  }

  appendPageParams(search, params);

  return request<PageResult<SystemUser>>(`/system-users${search.size ? `?${search.toString()}` : ''}`);
};
export const createSystemUser = (payload: {
  name: string;
  account: string;
  password: string;
  departmentId: number;
  roleIds: number[];
  status: string;
}) =>
  request<{ id: number }>('/system-users', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
export const updateSystemUser = (
  id: number,
  payload: {
    name: string;
    account: string;
    password?: string;
    departmentId: number;
    roleIds: number[];
    status: string;
  }
) =>
  request<null>(`/system-users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
export const updateSystemUserStatus = (id: number, status: string) =>
  request<null>(`/system-users/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
export const deleteSystemUser = (id: number) =>
  request<null>(`/system-users/${id}`, {
    method: 'DELETE'
  });
export const fetchRoles = (params?: PageParams) => {
  const search = new URLSearchParams();
  appendPageParams(search, params);
  return request<PageResult<RoleItem>>(`/roles${search.size ? `?${search.toString()}` : ''}`);
};
export const fetchRoleDetail = (id: number) => request<RoleDetail>(`/roles/${id}`);
export const fetchAuthorizationTree = () => request<AuthorizationTreeNode[]>('/authorization-tree');
export const createRole = (payload: { name: string; scope: string; status: '启用' | '停用' }) =>
  request<{ id: number }>('/roles', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
export const updateRole = (id: number, payload: { name: string; scope: string; status: '启用' | '停用' }) =>
  request<null>(`/roles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
export const updateRoleStatus = (id: number, status: '启用' | '停用') =>
  request<null>(`/roles/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
export const updateRolePermissions = (id: number, permissionIds: number[]) =>
  request<null>(`/roles/${id}/permissions`, {
    method: 'PUT',
    body: JSON.stringify({ permissionIds })
  });
export const updateRoleMenus = (id: number, menuIds: number[]) =>
  request<null>(`/roles/${id}/menus`, {
    method: 'PUT',
    body: JSON.stringify({ menuIds })
  });
export const deleteRole = (id: number) =>
  request<null>(`/roles/${id}`, {
    method: 'DELETE'
  });
export const fetchSiteUsers = (params?: { keyword?: string; status?: string } & PageParams) => {
  const search = new URLSearchParams();

  if (params?.keyword) {
    search.set('keyword', params.keyword);
  }

  if (params?.status) {
    search.set('status', params.status);
  }

  appendPageParams(search, params);

  return request<PageResult<SiteUser>>(`/site-users${search.size ? `?${search.toString()}` : ''}`);
};
export const createSiteUser = (payload: {
  nickname: string;
  phone: string;
  level: string;
  status: '正常' | '冻结';
}) =>
  request<{ id: number }>('/site-users', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
export const updateSiteUser = (
  id: number,
  payload: {
    nickname: string;
    phone: string;
    level: string;
    status: '正常' | '冻结';
  }
) =>
  request<null>(`/site-users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
export const updateSiteUserStatus = (id: number, status: '正常' | '冻结') =>
  request<null>(`/site-users/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
export const deleteSiteUser = (id: number) =>
  request<null>(`/site-users/${id}`, {
    method: 'DELETE'
  });
export const fetchDepartments = (params?: { keyword?: string }) => {
  const search = new URLSearchParams();

  if (params?.keyword) {
    search.set('keyword', params.keyword);
  }

  return request<DepartmentItem[]>(`/departments${search.size ? `?${search.toString()}` : ''}`);
};
export const createDepartment = (payload: {
  parentId: number | null;
  name: string;
  status: '启用' | '停用';
  sortOrder: number;
  leaders: Array<{
    adminUserId: number;
    phone: string;
    email: string;
  }>;
}) =>
  request<{ id: number }>('/departments', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
export const updateDepartment = (
  id: number,
  payload: {
    parentId: number | null;
    name: string;
    status: '启用' | '停用';
    sortOrder: number;
    leaders: Array<{
      adminUserId: number;
      phone: string;
      email: string;
    }>;
  }
) =>
  request<null>(`/departments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
export const deleteDepartment = (id: number) =>
  request<null>(`/departments/${id}`, {
    method: 'DELETE'
  });
export const fetchDepartmentUserOptions = () => request<DepartmentUserOption[]>('/department-user-options');
export const fetchDictTypes = (params?: { keyword?: string; status?: string } & PageParams) => {
  const search = new URLSearchParams();

  if (params?.keyword) {
    search.set('keyword', params.keyword);
  }

  if (params?.status) {
    search.set('status', params.status);
  }

  appendPageParams(search, params);

  return request<PageResult<DictTypeItem>>(`/dict-types${search.size ? `?${search.toString()}` : ''}`);
};
export const createDictType = (payload: {
  name: string;
  code: string;
  valueType: '字符串' | '数字' | '布尔';
  status: '启用' | '停用';
  sortOrder: number;
  remark: string;
}) =>
  request<{ id: number }>('/dict-types', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
export const updateDictType = (
  id: number,
  payload: {
    name: string;
    code: string;
    valueType: '字符串' | '数字' | '布尔';
    status: '启用' | '停用';
    sortOrder: number;
    remark: string;
  }
) =>
  request<null>(`/dict-types/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
export const deleteDictType = (id: number) =>
  request<null>(`/dict-types/${id}`, {
    method: 'DELETE'
  });
export const fetchDictItems = (
  dictTypeId: number,
  params?: { keyword?: string; status?: string; viewMode?: 'flat' | 'tree' } & PageParams
) => {
  const search = new URLSearchParams();

  if (params?.keyword) {
    search.set('keyword', params.keyword);
  }

  if (params?.status) {
    search.set('status', params.status);
  }

  if (params?.viewMode) {
    search.set('viewMode', params.viewMode);
  }

  appendPageParams(search, params);

  return request<PageResult<DictDataItem>>(`/dict-types/${dictTypeId}/items${search.size ? `?${search.toString()}` : ''}`);
};
export const createDictItem = (payload: {
  dictTypeId: number;
  parentId: number | null;
  label: string;
  value: string;
  status: '启用' | '停用';
  sortOrder: number;
  remark: string;
}) =>
  request<{ id: number }>('/dict-items', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
export const updateDictItem = (
  id: number,
  payload: {
    dictTypeId: number;
    parentId: number | null;
    label: string;
    value: string;
    status: '启用' | '停用';
    sortOrder: number;
    remark: string;
  }
) =>
  request<null>(`/dict-items/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
export const deleteDictItem = (id: number) =>
  request<null>(`/dict-items/${id}`, {
    method: 'DELETE'
  });
export const fetchPermissionGroups = () => request<PermissionGroup[]>('/permissions');
export const fetchMenus = () => request<AdminMenuItem[]>('/menus');
export const createMenu = (payload: {
  parentId: number | null;
  name: string;
  path: string;
  component: string;
  permissionCode: string;
  menuKey: string;
  menuType: 'directory' | 'menu' | 'button';
  icon: string;
  status: '启用' | '停用';
  visible: '显示' | '隐藏';
  sortOrder: number;
}) =>
  request<{ id: number }>('/menus', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
export const updateMenu = (
  id: number,
  payload: {
    parentId: number | null;
    name: string;
    path: string;
    component: string;
    permissionCode: string;
    menuKey: string;
    menuType: 'directory' | 'menu' | 'button';
    icon: string;
    status: '启用' | '停用';
    visible: '显示' | '隐藏';
    sortOrder: number;
  }
) =>
  request<null>(`/menus/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
export const deleteMenu = (id: number) =>
  request<null>(`/menus/${id}`, {
    method: 'DELETE'
  });
export const fetchProjectCategories = () => request<ProjectCategoryOption[]>('/project-categories');
export const fetchProjects = (
  params?: { keyword?: string; category?: string; status?: string; auditStatus?: string } & PageParams
) => {
  const search = new URLSearchParams();

  if (params?.keyword) {
    search.set('keyword', params.keyword);
  }

  if (params?.category) {
    search.set('category', params.category);
  }

  if (params?.status) {
    search.set('status', params.status);
  }

  if (params?.auditStatus) {
    search.set('auditStatus', params.auditStatus);
  }

  appendPageParams(search, params);

  return request<PageResult<ProjectItem>>(`/projects${search.size ? `?${search.toString()}` : ''}`);
};
export const createProject = (payload: {
  title: string;
  description: string;
  image: string;
  status: string;
  sortOrder: number;
  categoryId: number;
}) =>
  request<{ id: number }>('/projects', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
export const updateProject = (
  id: number,
  payload: {
    title: string;
    description: string;
    image: string;
    status: string;
    sortOrder: number;
    categoryId: number;
  }
) =>
  request<null>(`/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
export const updateProjectStatus = (id: number, status: string) =>
  request<null>(`/projects/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
export const auditProject = (id: number, payload: { action: 'approve' | 'reject'; comment?: string }) =>
  request<null>(`/projects/${id}/audit`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
export const deleteProject = (id: number) =>
  request<null>(`/projects/${id}`, {
    method: 'DELETE'
  });
