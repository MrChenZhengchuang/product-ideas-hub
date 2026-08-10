import { useEffect, useState } from 'react';
import { NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import type { ClientUser } from './api';
import { fetchCurrentClientUser, IS_DEMO_MODE } from './api';
import { clearClientToken, getClientToken } from './auth';
import { AboutPage } from './pages/AboutPage';
import { AuthPage } from './pages/AuthPage';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import { HomePage } from './pages/HomePage';
import { MePage } from './pages/MePage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { PublishPage } from './pages/PublishPage';
import { TrendsPage } from './pages/TrendsPage';

const navItems = [
  { label: '项目库', href: '/', end: true },
  { label: '趋势榜单', href: '/trends' },
  { label: '关于我们', href: '/about' },
  { label: '个人中心', href: '/me' }
];

function RequireAuth({ user, children }: { user: ClientUser | null; children: JSX.Element }) {
  const location = useLocation();

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  return children;
}

export default function App() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<ClientUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    if (!IS_DEMO_MODE && !getClientToken()) {
      setLoadingUser(false);
      return;
    }

    fetchCurrentClientUser()
      .then(setCurrentUser)
      .catch(() => {
        clearClientToken();
        setCurrentUser(null);
      })
      .finally(() => setLoadingUser(false));
  }, []);

  const handleLogout = () => {
    clearClientToken();
    setCurrentUser(null);
    navigate('/');
  };

  return (
    <main className="client-shell">
      <header className="site-header">
        <div className="site-header__inner">
          <NavLink className="site-logo" to="/">
            <span className="site-logo__mark">PI</span>
            <span className="site-logo__text">
              <strong>Product Ideas</strong>
              <small>发现值得做的产品方向</small>
            </span>
          </NavLink>

          <nav className="site-nav" aria-label="主导航">
            {navItems.map((item, index) => (
              <NavLink
                key={item.label}
                className={({ isActive }) => (isActive ? 'site-nav__link is-active' : 'site-nav__link')}
                to={item.href}
                end={item.end}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="site-header__actions">
            {currentUser ? (
              <>
                <span className="site-header__user">Hi, {currentUser.nickname}</span>
                <NavLink className="site-header__login" to="/me">
                  我的主页
                </NavLink>
                {!IS_DEMO_MODE ? (
                  <button className="site-header__ghost" type="button" onClick={handleLogout}>
                    退出
                  </button>
                ) : null}
              </>
            ) : (
              <NavLink className="site-header__login" to="/auth">
                登录 / 注册
              </NavLink>
            )}
            <NavLink className="site-header__cta" to="/publish">
              发布项目
            </NavLink>
          </div>
        </div>
      </header>

      {IS_DEMO_MODE ? (
        <aside className="demo-banner">
          <strong>在线交互演示</strong>
          <span>数据仅保存在当前浏览器；完整 Java + MySQL 版本请查看 GitHub 仓库。</span>
        </aside>
      ) : null}

      {loadingUser ? (
        <div className="page-loading">正在初始化用户信息...</div>
      ) : (
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/trends" element={<TrendsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/auth" element={<AuthPage onAuthSuccess={setCurrentUser} />} />
          <Route
            path="/publish"
            element={
              <RequireAuth user={currentUser}>
                <PublishPage />
              </RequireAuth>
            }
          />
          <Route
            path="/me"
            element={
              <RequireAuth user={currentUser}>
                <MePage />
              </RequireAuth>
            }
          />
          <Route
            path="/change-password"
            element={
              <RequireAuth user={currentUser}>
                <ChangePasswordPage />
              </RequireAuth>
            }
          />
          <Route
            path="/projects/:id"
            element={
              <RequireAuth user={currentUser}>
                <ProjectDetailPage />
              </RequireAuth>
            }
          />
        </Routes>
      )}
    </main>
  );
}
