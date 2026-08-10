export type AdminPreferences = {
  colorPrimary: string;
  showPageTabs: boolean;
  compactContent: boolean;
};

const ADMIN_PREFERENCES_KEY = 'admin_preferences';

export const defaultAdminPreferences: AdminPreferences = {
  colorPrimary: '#0f766e',
  showPageTabs: true,
  compactContent: false
};

export function normalizeAdminPreferences(value?: Partial<AdminPreferences> | null): AdminPreferences {
  return {
    colorPrimary: value?.colorPrimary || defaultAdminPreferences.colorPrimary,
    showPageTabs: value?.showPageTabs ?? defaultAdminPreferences.showPageTabs,
    compactContent: value?.compactContent ?? defaultAdminPreferences.compactContent
  };
}

export function getAdminPreferences(): AdminPreferences {
  const raw = localStorage.getItem(ADMIN_PREFERENCES_KEY);

  if (!raw) {
    return defaultAdminPreferences;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AdminPreferences>;
    return normalizeAdminPreferences(parsed);
  } catch (_error) {
    return defaultAdminPreferences;
  }
}

export function setAdminPreferences(preferences: AdminPreferences) {
  localStorage.setItem(ADMIN_PREFERENCES_KEY, JSON.stringify(normalizeAdminPreferences(preferences)));
}
