import {
  ApartmentOutlined,
  BarsOutlined,
  BookOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  DeploymentUnitOutlined,
  LockOutlined,
  ProfileOutlined,
  TeamOutlined,
  UserOutlined,
  UserSwitchOutlined
} from '@ant-design/icons';
import { Icon, addCollection } from '@iconify/react';
import type { IconifyJSON } from '@iconify/types';
import flatColorIcons from '@iconify-json/flat-color-icons/icons.json';
import iconParkOutline from '@iconify-json/icon-park-outline/icons.json';
import mdi from '@iconify-json/mdi/icons.json';
import type { ReactNode } from 'react';

addCollection(flatColorIcons as IconifyJSON);
addCollection(iconParkOutline as IconifyJSON);
addCollection(mdi as IconifyJSON);

const legacyAntIconMap: Record<string, ReactNode> = {
  ApartmentOutlined: <ApartmentOutlined />,
  BarsOutlined: <BarsOutlined />,
  BookOutlined: <BookOutlined />,
  DashboardOutlined: <DashboardOutlined />,
  DatabaseOutlined: <DatabaseOutlined />,
  DeploymentUnitOutlined: <DeploymentUnitOutlined />,
  HomeOutlined: <DashboardOutlined />,
  LockOutlined: <LockOutlined />,
  ProfileOutlined: <ProfileOutlined />,
  TeamOutlined: <TeamOutlined />,
  UserOutlined: <UserOutlined />,
  UserSwitchOutlined: <UserSwitchOutlined />
};

type MenuIconOption = {
  value: string;
  setLabel: string;
  keywords: string;
};

function buildOptions(prefix: string, setLabel: string, names: string[]): MenuIconOption[] {
  return names.map((name) => ({
    value: `${prefix}:${name}`,
    setLabel,
    keywords: `${setLabel} ${prefix} ${name}`.toLowerCase()
  }));
}

const outlineRecommendations = [
  'home',
  'application-menu',
  'table-report',
  'setting-config',
  'permissions',
  'peoples',
  'user-business',
  'organization-chart',
  'folder-open',
  'folder-close',
  'folder-code',
  'data-all',
  'data-file',
  'table',
  'chart-histogram',
  'chart-line',
  'doc-detail',
  'doc-search',
  'check-correct',
  'tag-one',
  'audit',
  'workbench',
  'list-view',
  'menu-fold',
  'menu-unfold',
  'dashboard-one',
  'edit',
  'shield',
  'lock',
  'config',
  'setting-two',
  'monitor',
  'shopping-bag',
  'shopping-cart',
  'notebook',
  'message-one',
  'mail',
  'remind',
  'people',
  'every-user',
  'peoples-two',
  'building-one',
  'bank',
  'doc-add',
  'doc-fail',
  'doc-success',
  'database-point',
  'search',
  'file-lock',
  'system'
];

const mdiRecommendations = [
  'view-dashboard-outline',
  'view-grid-outline',
  'view-list-outline',
  'office-building-outline',
  'domain',
  'account-group-outline',
  'account-outline',
  'account-cog-outline',
  'folder-cog-outline',
  'folder-outline',
  'folder-lock-outline',
  'chart-box-outline',
  'chart-line',
  'chart-timeline-variant',
  'clipboard-text-outline',
  'clipboard-list-outline',
  'shield-account-outline',
  'shield-key-outline',
  'tag-outline',
  'database-outline',
  'database-cog-outline',
  'file-document-outline',
  'file-chart-outline',
  'file-search-outline',
  'tune-variant',
  'cog-outline',
  'cog-box-outline',
  'security',
  'sitemap-outline',
  'store-outline',
  'cart-outline',
  'message-text-outline',
  'bell-outline',
  'email-outline',
  'book-open-page-variant-outline',
  'briefcase-outline',
  'archive-outline',
  'cash-multiple',
  'wallet-outline',
  'timeline-text-outline',
  'text-box-outline'
];

const legacyAntRecommendations = [
  'DashboardOutlined',
  'BarsOutlined',
  'ApartmentOutlined',
  'DatabaseOutlined',
  'DeploymentUnitOutlined',
  'TeamOutlined',
  'UserOutlined',
  'UserSwitchOutlined',
  'ProfileOutlined',
  'BookOutlined',
  'LockOutlined'
];

export const menuIconRecommendations = [
  ...legacyAntRecommendations.map((value) => ({
    value,
    setLabel: 'Ant 常用',
    keywords: `ant admin common ${value}`.toLowerCase()
  })),
  ...buildOptions('icon-park-outline', '后台线框', outlineRecommendations),
  ...buildOptions('mdi', '后台补充', mdiRecommendations)
];

export const menuMonochromeOptions = [
  ...Object.keys(legacyAntIconMap).map((name) => ({
    value: name,
    setLabel: '历史 Ant',
    keywords: `ant legacy admin ${name}`.toLowerCase()
  })),
  ...buildOptions('icon-park-outline', '线框图标', Object.keys(iconParkOutline.icons)),
  ...buildOptions('mdi', 'Material', Object.keys(mdi.icons))
];

export const menuColorfulOptions = buildOptions('flat-color-icons', '彩色图标', Object.keys(flatColorIcons.icons));

export const menuIconOptions = [
  ...menuMonochromeOptions,
  ...menuColorfulOptions
];

export function renderMenuIcon(iconName?: string, size = 18) {
  if (!iconName) {
    return undefined;
  }

  if (legacyAntIconMap[iconName]) {
    return legacyAntIconMap[iconName];
  }

  return (
    <span className="admin-menu-icon" style={{ display: 'inline-flex', lineHeight: 0 }}>
      <Icon icon={iconName} width={size} height={size} />
    </span>
  );
}
