import { Button, Image, Text, View } from '@tarojs/components';
import Taro, { useLoad } from '@tarojs/taro';
import { useState } from 'react';
import { routes } from '@/constants/routes';
import { PageShell } from '@/features/shell/PageShell';
import {
  favoriteProject,
  fetchProjectDetail,
  isAuthRedirectError,
  likeProject,
  type ProjectDetail,
  unfavoriteProject,
  unlikeProject
} from '@/services/client-api';
import { getAuditStatusLabel } from '@/utils/project';
import './index.scss';

export default function ProjectDetailPage() {
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<'favorite' | 'like' | null>(null);

  const loadProject = async (id = '') => {
    setLoading(true);
    setError('');

    try {
      const detail = await fetchProjectDetail(id);
      setProject(detail);
    } catch (detailError) {
      if (isAuthRedirectError(detailError)) {
        return;
      }

      setError(detailError instanceof Error ? detailError.message : '项目加载失败');
    } finally {
      setLoading(false);
    }
  };

  useLoad((options) => {
    void loadProject(options?.id || '');
  });

  const handleFavoriteToggle = async () => {
    if (!project) {
      return;
    }

    setActionLoading('favorite');

    try {
      if (project.isFavorited) {
        await unfavoriteProject(project.id);
      } else {
        await favoriteProject(project.id);
      }

      setProject({
        ...project,
        isFavorited: !project.isFavorited,
        favoriteCount: project.favoriteCount + (project.isFavorited ? -1 : 1)
      });
    } catch (actionError) {
      if (isAuthRedirectError(actionError)) {
        return;
      }

      const message = actionError instanceof Error ? actionError.message : '收藏操作失败';
      setError(message);
      Taro.showToast({ title: message, icon: 'none' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleLikeToggle = async () => {
    if (!project) {
      return;
    }

    setActionLoading('like');

    try {
      if (project.isLiked) {
        await unlikeProject(project.id);
      } else {
        await likeProject(project.id);
      }

      setProject({
        ...project,
        isLiked: !project.isLiked,
        likeCount: project.likeCount + (project.isLiked ? -1 : 1)
      });
    } catch (actionError) {
      if (isAuthRedirectError(actionError)) {
        return;
      }

      const message = actionError instanceof Error ? actionError.message : '点赞操作失败';
      setError(message);
      Taro.showToast({ title: message, icon: 'none' });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <PageShell title="项目详情" description="正在加载项目详情..." topBarTitle="项目详情" showTopBar showBackButton backFallbackUrl={routes.home} />;
  }

  if (error || !project) {
    return (
      <PageShell title="项目详情" description={error || '项目不存在'} topBarTitle="项目详情" showTopBar showBackButton backFallbackUrl={routes.home}>
        <Button onClick={() => Taro.navigateTo({ url: routes.auth })}>去登录后再试</Button>
      </PageShell>
    );
  }

  return (
    <PageShell title={project.title} description={project.description} topBarTitle="项目详情" showTopBar showBackButton backFallbackUrl={routes.home}>
      <Image className="mobile-project-detail__image" src={project.image} mode="aspectFill" />
      <View className="mobile-project-detail__meta">
        <Text>{project.categoryLabel}</Text>
        <Text>发布者：{project.authorName || '官方项目库'}</Text>
        <Text>状态：{project.status}</Text>
        <Text>审核：{getAuditStatusLabel(project.auditStatus)}</Text>
        <Text>浏览：{project.viewCount}</Text>
        <Text>收藏：{project.favoriteCount}</Text>
        <Text>点赞：{project.likeCount}</Text>
      </View>

      {project.auditStatus === 'approved' ? (
        <View className="mobile-project-detail__actions">
          <Button
            className={project.isFavorited ? 'mobile-project-detail__action mobile-project-detail__action--active' : 'mobile-project-detail__action'}
            loading={actionLoading === 'favorite'}
            onClick={handleFavoriteToggle}
          >
            {project.isFavorited ? '已收藏' : '收藏'}
          </Button>
          <Button
            className={project.isLiked ? 'mobile-project-detail__action mobile-project-detail__action--active' : 'mobile-project-detail__action'}
            loading={actionLoading === 'like'}
            onClick={handleLikeToggle}
          >
            {project.isLiked ? '已点赞' : '点赞'}
          </Button>
        </View>
      ) : null}

      {project.isOwner && project.auditStatus !== 'approved' ? (
        <View className="mobile-project-detail__notice">
          <Text>
            {project.auditStatus === 'rejected'
              ? `你的项目已被驳回${project.auditComment ? `：${project.auditComment}` : ''}`
              : '你的项目正在审核中，审核通过后会出现在首页项目库。'}
          </Text>
        </View>
      ) : null}

      {project.content ? (
        <View className="mobile-project-detail__content">
          <Text>{project.content}</Text>
        </View>
      ) : null}
    </PageShell>
  );
}
