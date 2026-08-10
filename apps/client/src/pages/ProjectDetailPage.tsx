import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  favoriteProject,
  fetchProjectDetail,
  likeProject,
  type ProjectDetail,
  unfavoriteProject,
  unlikeProject
} from '../api';

export function ProjectDetailPage() {
  const { id = '' } = useParams();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<'favorite' | 'like' | null>(null);

  useEffect(() => {
    setLoading(true);
    setError('');
    fetchProjectDetail(id)
      .then(setProject)
      .catch((detailError) => setError(detailError instanceof Error ? detailError.message : '项目加载失败'))
      .finally(() => setLoading(false));
  }, [id]);

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
      setError(actionError instanceof Error ? actionError.message : '收藏操作失败');
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
      setError(actionError instanceof Error ? actionError.message : '点赞操作失败');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <section className="detail-page"><div className="empty-state">正在加载项目详情...</div></section>;
  }

  if (error || !project) {
    return <section className="detail-page"><div className="empty-state">{error || '项目不存在'}</div></section>;
  }

  return (
    <section className="detail-page">
      <div className="detail-page__hero">
        <img className="detail-page__image" src={project.image} alt={project.title} />
        <div className="detail-page__content">
          <p className="section-heading__eyebrow">{project.categoryLabel}</p>
          <h1>{project.title}</h1>
          <p>{project.description}</p>
          <div className="detail-page__meta">
            <span>发布者：{project.authorName || '官方项目库'}</span>
            <span>状态：{project.status}</span>
            <span>审核：{project.auditStatus === 'approved' ? '已通过' : project.auditStatus === 'rejected' ? '已驳回' : '待审核'}</span>
            <span>浏览：{project.viewCount}</span>
            <span>收藏：{project.favoriteCount}</span>
            <span>点赞：{project.likeCount}</span>
          </div>
          {project.auditStatus === 'approved' ? (
            <div className="detail-page__actions">
              <button type="button" className={project.isFavorited ? 'detail-action is-active' : 'detail-action'} onClick={handleFavoriteToggle} disabled={actionLoading !== null}>
                {actionLoading === 'favorite' ? '处理中...' : project.isFavorited ? '已收藏' : '收藏'}
              </button>
              <button type="button" className={project.isLiked ? 'detail-action is-active' : 'detail-action'} onClick={handleLikeToggle} disabled={actionLoading !== null}>
                {actionLoading === 'like' ? '处理中...' : project.isLiked ? '已点赞' : '点赞'}
              </button>
            </div>
          ) : null}
          {project.isOwner && project.auditStatus !== 'approved' ? (
            <div className="empty-state" style={{ marginTop: 20 }}>
              {project.auditStatus === 'rejected'
                ? `你的项目已被驳回${project.auditComment ? `：${project.auditComment}` : ''}`
                : '你的项目正在审核中，审核通过后会出现在首页项目库。'}
            </div>
          ) : null}
          {project.content ? <p>{project.content}</p> : null}
        </div>
      </div>
    </section>
  );
}
