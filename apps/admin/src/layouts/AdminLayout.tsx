import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CloseOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuOutlined,
  MenuUnfoldOutlined,
  UserOutlined
} from '@ant-design/icons';
import { Avatar, Breadcrumb, Button, Drawer, Dropdown, Grid, Layout, Menu, Popconfirm, Space, Tag, Typography } from 'antd';
import type { BreadcrumbProps, MenuProps } from 'antd';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import type { AdminMenuItem, CurrentAdmin } from '../api';
import type { AdminPreferences } from '../preferences';
import { renderMenuIcon } from '../utils/menu-icons';

const { Header, Sider, Content } = Layout;

const SIDER_WIDTH = 240;
const SIDER_ICON_WIDTH = 80;
const SIDER_TRANSITION_MS = 260;

function flattenMenus(items: AdminMenuItem[]): AdminMenuItem[] {
  return items.flatMap((item) => [item, ...flattenMenus(item.children)]);
}

function toMenuItems(items: AdminMenuItem[]): MenuProps['items'] {
  return items
    .filter((item) => item.menuType !== 'button')
    .map((item) => ({
      key: item.path || item.menuKey,
      icon: renderMenuIcon(item.icon),
      label: item.menuType === 'directory' ? item.name : <Link to={item.path}>{item.name}</Link>,
      children: item.children.length ? toMenuItems(item.children) : undefined
    }));
}

type AdminLayoutProps = {
  currentAdmin: CurrentAdmin;
  onLogout: () => void;
  preferences: AdminPreferences;
};

type RouteMeta = {
  group: string;
  title: string;
};

export function AdminLayout({ currentAdmin, onLogout, preferences }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const screens = Grid.useBreakpoint();
  const isMobileSider = screens.lg === false;
  const [visitedTabs, setVisitedTabs] = useState<string[]>(['/dashboard']);
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [siderLabelsReady, setSiderLabelsReady] = useState(true);
  const siderRef = useRef<HTMLDivElement>(null);

  const flatMenus = useMemo(() => flattenMenus(currentAdmin.menus), [currentAdmin.menus]);
  const routeMetaMap = useMemo(
    () =>
      Object.fromEntries(
        flatMenus
          .filter((item) => item.menuType === 'menu' && item.path)
          .map((item) => {
            const parent = flatMenus.find((candidate) => candidate.id === item.parentId);
            return [item.path, { group: parent?.name || '页面', title: item.name }];
          })
      ) as Record<string, RouteMeta>,
    [flatMenus]
  );
  const extendedRouteMetaMap = useMemo(
    (): Record<string, RouteMeta> => ({
      ...routeMetaMap,
      '/account-center': { group: '账号设置', title: '个人中心' }
    }),
    [routeMetaMap]
  );

  const menuItems = useMemo(() => toMenuItems(currentAdmin.menus), [currentAdmin.menus]);

  const currentPath = location.pathname === '/' ? '/dashboard' : location.pathname;
  const selectedKeys = useMemo(() => [currentPath], [currentPath]);

  const currentRouteMeta = useMemo(
    () => extendedRouteMetaMap[currentPath] || { group: '页面', title: '未命名页面' },
    [currentPath, extendedRouteMetaMap]
  );

  const breadcrumbItems = useMemo(() => {
    const items: BreadcrumbProps['items'] = [{ title: '首页' }];
    const { group, title } = currentRouteMeta;
    const showGroup = Boolean(group) && group !== '页面' && group !== title;

    if (showGroup) {
      items.push({ title: group });
    }

    items.push({ title });
    return items;
  }, [currentRouteMeta]);

  const isDesktopIconCollapsed = !isMobileSider && (desktopCollapsed || !siderLabelsReady);
  const isSiderResizing = !isMobileSider && !desktopCollapsed && !siderLabelsReady;

  useEffect(() => {
    if (isMobileSider) {
      setSiderLabelsReady(true);
      return;
    }

    if (desktopCollapsed) {
      setSiderLabelsReady(false);
      return;
    }

    let finished = false;
    const finish = () => {
      if (!finished) {
        finished = true;
        setSiderLabelsReady(true);
      }
    };

    const siderNode = siderRef.current;
    const onTransitionEnd = (event: TransitionEvent) => {
      if (event.target !== siderNode) {
        return;
      }

      if (event.propertyName === 'width' || event.propertyName === 'min-width' || event.propertyName === 'max-width') {
        finish();
      }
    };

    siderNode?.addEventListener('transitionend', onTransitionEnd);
    const timer = window.setTimeout(finish, SIDER_TRANSITION_MS);

    return () => {
      siderNode?.removeEventListener('transitionend', onTransitionEnd);
      window.clearTimeout(timer);
    };
  }, [desktopCollapsed, isMobileSider]);

  useEffect(() => {
    if (extendedRouteMetaMap[currentPath]) {
      setVisitedTabs((prev) => (prev.includes(currentPath) ? prev : [...prev, currentPath]));
    }
  }, [currentPath, extendedRouteMetaMap]);

  useEffect(() => {
    if (isMobileSider) {
      setMobileDrawerOpen(false);
    }
  }, [currentPath, isMobileSider]);

  useEffect(() => {
    if (!isMobileSider) {
      setMobileDrawerOpen(false);
    }
  }, [isMobileSider]);

  useEffect(() => {
    if (isDesktopIconCollapsed) {
      setOpenKeys([]);
    }
  }, [isDesktopIconCollapsed]);

  const closeMobileDrawer = () => {
    setMobileDrawerOpen(false);
  };

  const siderMenu = (
    <Menu
      mode="inline"
      inlineCollapsed={isDesktopIconCollapsed}
      selectedKeys={selectedKeys}
      openKeys={openKeys}
      onOpenChange={(keys) => setOpenKeys(keys as string[])}
      items={menuItems}
    />
  );

  const siderBrand = (
    <div className="brand">
      <div className="brand__mark">PM</div>
      <div className="brand__info">
        <Typography.Title level={5} style={{ margin: 0 }}>
          项目后台
        </Typography.Title>
        <Typography.Text type="secondary">Management Console</Typography.Text>
      </div>
      {isMobileSider ? (
        <button type="button" className="admin-sider__close" aria-label="关闭侧边栏" onClick={closeMobileDrawer}>
          <CloseOutlined />
        </button>
      ) : null}
    </div>
  );

  const closeTab = (path: string) => {
    if (path === '/dashboard') {
      return;
    }

    setVisitedTabs((prev) => {
      const nextTabs = prev.filter((item) => item !== path);

      if (path === currentPath) {
        navigate(nextTabs[nextTabs.length - 1] || '/dashboard');
      }

      return nextTabs;
    });
  };

  return (
    <Layout className={preferences.compactContent ? 'admin-layout admin-layout--compact' : 'admin-layout'}>
      {isMobileSider ? (
        <Drawer
          placement="left"
          open={mobileDrawerOpen}
          onClose={closeMobileDrawer}
          width={SIDER_WIDTH}
          closable={false}
          destroyOnClose={false}
          className="admin-mobile-drawer"
          styles={{
            body: { padding: 0 },
            header: { display: 'none' }
          }}
        >
          <div className="admin-sider admin-sider--drawer">
            {siderBrand}
            {siderMenu}
          </div>
        </Drawer>
      ) : (
        <Sider
          ref={siderRef}
          width={SIDER_WIDTH}
          collapsible
          collapsedWidth={SIDER_ICON_WIDTH}
          collapsed={desktopCollapsed}
          onCollapse={setDesktopCollapsed}
          trigger={null}
          theme="light"
          className={[
            'admin-sider',
            isDesktopIconCollapsed ? 'admin-sider--icon-only' : '',
            isSiderResizing ? 'admin-sider--resizing' : ''
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {siderBrand}
          {siderMenu}
        </Sider>
      )}
      <Layout>
        <Header className="admin-header">
          <div className="admin-header__left">
            {isMobileSider ? (
              <button
                type="button"
                className="admin-header__menu-toggle"
                aria-label={mobileDrawerOpen ? '关闭侧边栏' : '打开侧边栏'}
                aria-expanded={mobileDrawerOpen}
                onClick={() => setMobileDrawerOpen((open) => !open)}
              >
                {mobileDrawerOpen ? <CloseOutlined /> : <MenuOutlined />}
              </button>
            ) : (
              <button
                type="button"
                className="admin-header__menu-toggle"
                aria-label={desktopCollapsed ? '展开侧边栏' : '收起侧边栏'}
                aria-expanded={!desktopCollapsed}
                onClick={() => setDesktopCollapsed((collapsed) => !collapsed)}
              >
                {desktopCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              </button>
            )}
            <Breadcrumb items={breadcrumbItems} />
          </div>
          <Space size={16} className="admin-header__right">
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'account-center',
                    icon: <UserOutlined />,
                    label: '个人中心',
                    onClick: () => navigate('/account-center')
                  }
                ]
              }}
              trigger={['click']}
            >
              <button type="button" className="admin-header__identity">
                <Tag color="blue">{currentAdmin.role}</Tag>
                <Avatar size="small" src={currentAdmin.avatar || undefined}>
                  {currentAdmin.name.slice(0, 1)}
                </Avatar>
                <Typography.Text className="admin-header__name">{currentAdmin.name}</Typography.Text>
              </button>
            </Dropdown>
            <Popconfirm title="确认退出登录吗？" onConfirm={onLogout}>
              <Button type="text" icon={<LogoutOutlined />} className="admin-header__logout">
                退出
              </Button>
            </Popconfirm>
          </Space>
        </Header>
        <Content className="admin-content">
          {preferences.showPageTabs ? (
            <div className="admin-pagebar">
              <div className="admin-tagsbar">
                {visitedTabs.map((path) => {
                  const meta = extendedRouteMetaMap[path];
                  if (!meta) {
                    return null;
                  }

                  const active = path === currentPath;

                  return (
                    <div key={path} className={active ? 'admin-tab admin-tab--active' : 'admin-tab'}>
                      <button type="button" className="admin-tab__label" onClick={() => navigate(path)}>
                        {meta.title}
                      </button>
                      {path !== '/dashboard' ? (
                        <button
                          type="button"
                          className="admin-tab__close"
                          aria-label={`关闭${meta.title}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            closeTab(path);
                          }}
                        >
                          <CloseOutlined />
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
