import { Navigate, Route, Routes } from 'react-router-dom';
import { ConfigProvider, Spin } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { useEffect, useMemo, useState } from 'react';
import { clearAdminToken } from './auth';
import { AdminLayout } from './layouts/AdminLayout';
import { useAdminBootstrap } from './hooks/useAdminBootstrap';
import { fetchAdminPreferences, fetchCurrentAdmin, logoutAdmin, updateAdminPreferences, type CurrentAdmin } from './api';
import { AccountCenterPage } from './pages/AccountCenterPage';
import { DashboardPage } from './pages/DashboardPage';
import { DepartmentManagementPage } from './pages/DepartmentManagementPage';
import { DictManagementPage } from './pages/DictManagementPage';
import { LoginPage } from './pages/LoginPage';
import { MenuManagementPage } from './pages/MenuManagementPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { RolesPage } from './pages/RolesPage';
import { SiteUsersPage } from './pages/SiteUsersPage';
import { SystemUsersPage } from './pages/SystemUsersPage';
import {
  defaultAdminPreferences,
  getAdminPreferences,
  normalizeAdminPreferences,
  setAdminPreferences,
  type AdminPreferences
} from './preferences';

export default function App() {
  const { currentAdmin, loading, setCurrentAdmin } = useAdminBootstrap();
  const [preferences, setPreferences] = useState<AdminPreferences>(() => getAdminPreferences());

  const themeConfig = useMemo(
    () => ({
      token: {
        colorPrimary: preferences.colorPrimary || defaultAdminPreferences.colorPrimary,
        borderRadius: 14
      }
    }),
    [preferences.colorPrimary]
  );

  useEffect(() => {
    if (!currentAdmin) {
      return;
    }

    fetchAdminPreferences()
      .then((nextPreferences) => {
        const normalized = normalizeAdminPreferences(nextPreferences);
        setPreferences(normalized);
        setAdminPreferences(normalized);
      })
      .catch(() => {
        const cached = getAdminPreferences();
        setPreferences(cached);
      });
  }, [currentAdmin?.id]);

  const refreshCurrentAdmin = async () => {
    const admin = await fetchCurrentAdmin();
    setCurrentAdmin(admin);
    return admin;
  };

  const patchCurrentAdminAvatar = (avatar: string) => {
    setCurrentAdmin((prev) => (prev ? { ...prev, avatar } : prev));
  };

  const handleLoginSuccess = (admin: CurrentAdmin) => {
    setCurrentAdmin(admin);
  };

  const handleLogout = async () => {
    try {
      await logoutAdmin();
    } catch (_error) {
      // Ignore logout request failures and clear local state anyway.
    } finally {
      clearAdminToken();
      setCurrentAdmin(null);
      setPreferences(getAdminPreferences());
    }
  };

  const handlePreferencesChange = async (nextPreferences: AdminPreferences) => {
    const normalized = normalizeAdminPreferences(nextPreferences);
    const previous = preferences;

    setPreferences(normalized);
    setAdminPreferences(normalized);

    try {
      const savedPreferences = await updateAdminPreferences(normalized);
      const finalPreferences = normalizeAdminPreferences(savedPreferences);
      setPreferences(finalPreferences);
      setAdminPreferences(finalPreferences);
    } catch (error) {
      setPreferences(previous);
      setAdminPreferences(previous);
      throw error;
    }
  };

  return (
    <ConfigProvider
      locale={zhCN}
      theme={themeConfig}
    >
      {loading ? (
        <div className="admin-loading">
          <Spin size="large" />
        </div>
      ) : (
        <Routes>
          <Route
            path="/login"
            element={
              currentAdmin ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <LoginPage
                  onLoginSuccess={handleLoginSuccess}
                  refreshCurrentAdmin={refreshCurrentAdmin}
                />
              )
            }
          />
          {currentAdmin ? (
            <Route element={<AdminLayout currentAdmin={currentAdmin} onLogout={handleLogout} preferences={preferences} />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route
                path="/account-center"
                element={
                  <AccountCenterPage
                    currentAdmin={currentAdmin}
                    refreshCurrentAdmin={refreshCurrentAdmin}
                    onAvatarChange={patchCurrentAdminAvatar}
                    preferences={preferences}
                    onPreferencesChange={handlePreferencesChange}
                  />
                }
              />
              <Route path="/system-users" element={<SystemUsersPage currentAdmin={currentAdmin} />} />
              <Route path="/roles" element={<RolesPage currentAdmin={currentAdmin} />} />
              <Route path="/site-users" element={<SiteUsersPage currentAdmin={currentAdmin} />} />
              <Route
                path="/menu-management"
                element={<MenuManagementPage currentAdmin={currentAdmin} refreshCurrentAdmin={refreshCurrentAdmin} />}
              />
              <Route path="/departments" element={<DepartmentManagementPage currentAdmin={currentAdmin} />} />
              <Route path="/dict-management" element={<DictManagementPage currentAdmin={currentAdmin} />} />
              <Route path="/projects" element={<ProjectsPage currentAdmin={currentAdmin} />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          ) : (
            <Route path="*" element={<Navigate to="/login" replace />} />
          )}
        </Routes>
      )}
    </ConfigProvider>
  );
}
