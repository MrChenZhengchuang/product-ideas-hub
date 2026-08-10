import { useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  changeClientPassword,
  fetchClientProfile,
  fetchMyFavorites,
  fetchMyProjects,
  type ClientProfile,
  type UserProjectItem
} from '../api';

type MeTab = 'projects' | 'favorites' | 'security';

function formatAuditStatus(item: UserProjectItem) {
  if (item.auditStatus === 'approved') {
    return '已通过';
  }

  if (item.auditStatus === 'rejected') {
    return item.auditComment ? `已驳回: ${item.auditComment}` : '已驳回';
  }

  return '审核中';
}

export function MePage() {
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [projects, setProjects] = useState<UserProjectItem[]>([]);
  const [favorites, setFavorites] = useState<UserProjectItem[]>([]);
  const [activeTab, setActiveTab] = useState<MeTab>('projects');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [submittingPassword, setSubmittingPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
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

  const handlePasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmittingPassword(true);
    setPasswordError('');
    setPasswordMessage('');

    try {
      await changeClientPassword({ oldPassword, newPassword });
      setOldPassword('');
      setNewPassword('');
      setPasswordMessage('密码修改成功');
    } catch (submitError) {
      setPasswordError(submitError instanceof Error ? submitError.message : '密码修改失败');
    } finally {
      setSubmittingPassword(false);
    }
  };

  if (loading) {
    return <section className="me-page"><div className="empty-state">正在加载个人中心...</div></section>;
  }

  if (error || !profile) {
    return <section className="me-page"><div className="empty-state">{error || '个人信息不存在'}</div></section>;
  }

  return (
    <section className="me-page">
      <div className="me-hero">
        <div>
          <p className="section-heading__eyebrow">Personal Hub</p>
          <h1>{profile.nickname}</h1>
          <p>这里会沉淀你的发布记录、收藏轨迹，以及项目拿到的真实反馈。</p>
        </div>
        <div className="me-hero__meta">
          <span>{profile.phone}</span>
          <span>{profile.memberLevel}</span>
          <span>{profile.status}</span>
        </div>
      </div>

      <section className="me-stats">
        <article className="me-stat-card">
          <strong>{stats.publishedProjects}</strong>
          <span>我的发布</span>
        </article>
        <article className="me-stat-card">
          <strong>{stats.pendingProjects}</strong>
          <span>审核中</span>
        </article>
        <article className="me-stat-card">
          <strong>{stats.totalFavorites}</strong>
          <span>累计收藏</span>
        </article>
        <article className="me-stat-card">
          <strong>{stats.totalLikes}</strong>
          <span>累计点赞</span>
        </article>
      </section>

      <section className="me-panel">
        <div className="me-tabs" role="tablist" aria-label="个人中心导航">
          <button type="button" className={activeTab === 'projects' ? 'me-tab is-active' : 'me-tab'} onClick={() => setActiveTab('projects')}>
            我的发布
          </button>
          <button type="button" className={activeTab === 'favorites' ? 'me-tab is-active' : 'me-tab'} onClick={() => setActiveTab('favorites')}>
            我的收藏
          </button>
          <button type="button" className={activeTab === 'security' ? 'me-tab is-active' : 'me-tab'} onClick={() => setActiveTab('security')}>
            账号安全
          </button>
        </div>

        {activeTab === 'projects' ? (
          <div className="me-list">
            {projects.length === 0 ? <div className="empty-state">你还没有发布项目</div> : null}
            {projects.map((item) => (
              <article key={item.id} className="me-list-card">
                <img className="me-list-card__image" src={item.image} alt={item.title} />
                <div className="me-list-card__body">
                  <div className="me-list-card__header">
                    <span className="me-list-card__category">{item.categoryLabel}</span>
                    <span className="me-list-card__status">{formatAuditStatus(item)}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <div className="me-list-card__meta">
                    <span>浏览 {item.viewCount}</span>
                    <span>收藏 {item.favoriteCount}</span>
                    <span>点赞 {item.likeCount}</span>
                  </div>
                  <NavLink className="project-card__link" to={`/projects/${item.id}`}>
                    查看详情
                  </NavLink>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        {activeTab === 'favorites' ? (
          <div className="me-list">
            {favorites.length === 0 ? <div className="empty-state">你还没有收藏任何项目</div> : null}
            {favorites.map((item) => (
              <article key={item.id} className="me-list-card">
                <img className="me-list-card__image" src={item.image} alt={item.title} />
                <div className="me-list-card__body">
                  <div className="me-list-card__header">
                    <span className="me-list-card__category">{item.categoryLabel}</span>
                    <span className="me-list-card__status">{item.authorName || '官方项目库'}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <div className="me-list-card__meta">
                    <span>浏览 {item.viewCount}</span>
                    <span>收藏 {item.favoriteCount}</span>
                    <span>点赞 {item.likeCount}</span>
                  </div>
                  <NavLink className="project-card__link" to={`/projects/${item.id}`}>
                    查看详情
                  </NavLink>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        {activeTab === 'security' ? (
          <form className="auth-form auth-form--embedded" onSubmit={handlePasswordSubmit}>
            <div className="publish-field">
              <label htmlFor="me-old-password">原密码</label>
              <input id="me-old-password" type="password" value={oldPassword} onChange={(event) => setOldPassword(event.target.value)} />
            </div>
            <div className="publish-field">
              <label htmlFor="me-new-password">新密码</label>
              <input id="me-new-password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
            </div>
            {passwordError ? <p className="auth-form__error">{passwordError}</p> : null}
            {passwordMessage ? <p className="auth-form__success">{passwordMessage}</p> : null}
            <button className="auth-form__submit auth-form__submit--inline" type="submit" disabled={submittingPassword}>
              {submittingPassword ? '提交中...' : '更新密码'}
            </button>
          </form>
        ) : null}
      </section>
    </section>
  );
}
