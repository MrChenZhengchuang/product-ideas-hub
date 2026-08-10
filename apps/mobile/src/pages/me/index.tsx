import { Button, Image, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useEffect, useMemo, useState } from 'react';
import { clearClientToken, getClientToken } from '@/auth';
import { routes } from '@/constants/routes';
import { PageShell } from '@/features/shell/PageShell';
import {
  fetchClientProfile,
  isAuthRedirectError,
  fetchMyFavorites,
  fetchMyProjects,
  type ClientProfile,
  type UserProjectItem
} from '@/services/client-api';
import { getAuditStatusLabel } from '@/utils/project';
import './index.scss';

export default function MePage() {
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [projects, setProjects] = useState<UserProjectItem[]>([]);
  const [favorites, setFavorites] = useState<UserProjectItem[]>([]);
  const [activeTab, setActiveTab] = useState<'projects' | 'favorites' | 'security'>('projects');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getClientToken()) {
      setLoading(false);
      return;
    }

    let active = true;

    Promise.all([fetchClientProfile(), fetchMyProjects(), fetchMyFavorites()])
      .then(([nextProfile, nextProjects, nextFavorites]) => {
        if (!active) {
          return;
        }

        setProfile(nextProfile);
        setProjects(nextProjects);
        setFavorites(nextFavorites);
      })
      .catch((loadError) => {
        if (!active) {
          return;
        }

        if (isAuthRedirectError(loadError)) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : '个人中心加载失败');
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(
    () =>
      profile?.stats || {
        publishedProjects: 0,
        pendingProjects: 0,
        totalFavorites: 0,
        totalLikes: 0
      },
    [profile]
  );

  const openProject = (id: number) => {
    Taro.navigateTo({ url: `${routes.projectDetail}?id=${id}` });
  };

  const logout = () => {
    clearClientToken();
    setProfile(null);
    Taro.showToast({ title: '已退出登录', icon: 'success' });
  };

  if (!getClientToken()) {
    return (
      <PageShell title="我的" description="登录后可以查看个人资料、我的发布、收藏记录和账号安全。">
        <Button onClick={() => Taro.navigateTo({ url: routes.auth })}>去登录 / 注册</Button>
      </PageShell>
    );
  }

  if (loading) {
    return <PageShell title="我的" description="正在加载个人中心..." />;
  }

  if (error || !profile) {
    return (
      <PageShell title="我的" description={error || '个人信息不存在'}>
        <Button onClick={() => Taro.navigateTo({ url: routes.auth })}>重新登录</Button>
      </PageShell>
    );
  }

  return (
    <PageShell title={profile.nickname} description="这里会沉淀你的发布记录、收藏轨迹，以及项目拿到的真实反馈。">
      <View className="mobile-me__meta">
        <Text>{profile.phone}</Text>
        <Text>{profile.memberLevel}</Text>
        <Text>{profile.status}</Text>
      </View>

      <View className="mobile-me__stats">
        <View className="mobile-me__stat-card">
          <Text className="mobile-me__stat-number">{stats.publishedProjects}</Text>
          <Text className="mobile-me__stat-label">我的发布</Text>
        </View>
        <View className="mobile-me__stat-card">
          <Text className="mobile-me__stat-number">{stats.pendingProjects}</Text>
          <Text className="mobile-me__stat-label">审核中</Text>
        </View>
        <View className="mobile-me__stat-card">
          <Text className="mobile-me__stat-number">{stats.totalFavorites}</Text>
          <Text className="mobile-me__stat-label">累计收藏</Text>
        </View>
        <View className="mobile-me__stat-card">
          <Text className="mobile-me__stat-number">{stats.totalLikes}</Text>
          <Text className="mobile-me__stat-label">累计点赞</Text>
        </View>
      </View>

      <View className="mobile-me__tabs">
        <View className={activeTab === 'projects' ? 'mobile-me__tab mobile-me__tab--active' : 'mobile-me__tab'} onClick={() => setActiveTab('projects')}>
          <Text>我的发布</Text>
        </View>
        <View className={activeTab === 'favorites' ? 'mobile-me__tab mobile-me__tab--active' : 'mobile-me__tab'} onClick={() => setActiveTab('favorites')}>
          <Text>我的收藏</Text>
        </View>
        <View className={activeTab === 'security' ? 'mobile-me__tab mobile-me__tab--active' : 'mobile-me__tab'} onClick={() => setActiveTab('security')}>
          <Text>账号安全</Text>
        </View>
      </View>

      {activeTab === 'projects' ? (
        <View className="mobile-me__list">
          {projects.length === 0 ? <Text className="mobile-me__empty">你还没有发布项目</Text> : null}
          {projects.map((item) => (
            <View key={item.id} className="mobile-me__card" onClick={() => openProject(item.id)}>
              <Image className="mobile-me__card-image" src={item.image} mode="aspectFill" />
              <View className="mobile-me__card-body">
                <View className="mobile-me__card-header">
                  <Text className="mobile-me__card-category">{item.categoryLabel}</Text>
                  <Text className="mobile-me__card-status">{getAuditStatusLabel(item.auditStatus)}</Text>
                </View>
                <Text className="mobile-me__card-title">{item.title}</Text>
                <Text className="mobile-me__card-description">{item.description}</Text>
                <View className="mobile-me__card-meta">
                  <Text>浏览 {item.viewCount}</Text>
                  <Text>收藏 {item.favoriteCount}</Text>
                  <Text>点赞 {item.likeCount}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {activeTab === 'favorites' ? (
        <View className="mobile-me__list">
          {favorites.length === 0 ? <Text className="mobile-me__empty">你还没有收藏任何项目</Text> : null}
          {favorites.map((item) => (
            <View key={item.id} className="mobile-me__card" onClick={() => openProject(item.id)}>
              <Image className="mobile-me__card-image" src={item.image} mode="aspectFill" />
              <View className="mobile-me__card-body">
                <View className="mobile-me__card-header">
                  <Text className="mobile-me__card-category">{item.categoryLabel}</Text>
                  <Text className="mobile-me__card-status">{item.authorName || '官方项目库'}</Text>
                </View>
                <Text className="mobile-me__card-title">{item.title}</Text>
                <Text className="mobile-me__card-description">{item.description}</Text>
                <View className="mobile-me__card-meta">
                  <Text>浏览 {item.viewCount}</Text>
                  <Text>收藏 {item.favoriteCount}</Text>
                  <Text>点赞 {item.likeCount}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {activeTab === 'security' ? (
        <View className="mobile-me__security">
          <Button onClick={() => Taro.navigateTo({ url: routes.changePassword })}>去修改密码</Button>
          <Button onClick={logout}>退出登录</Button>
        </View>
      ) : null}
    </PageShell>
  );
}
