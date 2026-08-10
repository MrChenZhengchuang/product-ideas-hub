import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { publishProject, type ProjectCategory } from '../api';

export function PublishPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Exclude<ProjectCategory, 'all'>>('ai');
  const [summary, setSummary] = useState('');
  const [details, setDetails] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      const result = await publishProject({ title, category, summary, details });
      setMessage('项目已提交审核，正在跳转项目页...');
      setTimeout(() => navigate(`/projects/${result.id}`), 600);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '发布失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="publish-page">
      <div className="publish-page__hero">
        <p className="section-heading__eyebrow">Publish Your Idea</p>
        <h1>把你的项目想法发布出来</h1>
        <p>
          无论你是独立开发者、产品经理、设计师还是创业者，都可以把自己的项目灵感、目标用户和验证思路写下来，让更多人看到、讨论、共创。
        </p>
      </div>

      <div className="publish-layout">
        <form className="publish-panel__form publish-panel__form--page" onSubmit={handleSubmit}>
          <div className="publish-field">
            <label htmlFor="idea-title">项目标题</label>
            <input id="idea-title" value={title} onChange={(event) => setTitle(event.target.value)} type="text" placeholder="比如：AI 面试陪练 / 私域活动排期器 / 创作者选题池" />
          </div>
          <div className="publish-field">
            <label htmlFor="idea-category">项目方向</label>
            <select
              id="idea-category"
              className="publish-select"
              value={category}
              onChange={(event) => setCategory(event.target.value as Exclude<ProjectCategory, 'all'>)}
            >
              <option value="ai">AI 应用</option>
              <option value="ecommerce">电商零售</option>
              <option value="tool">效率工具</option>
              <option value="content">内容社区</option>
            </select>
          </div>
          <div className="publish-field">
            <label htmlFor="idea-summary">一句话想法</label>
            <textarea
              id="idea-summary"
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              placeholder="用 1 到 3 句话描述你的项目要解决什么问题，适合谁使用，以及为什么值得做。"
              rows={5}
            />
          </div>
          <div className="publish-field">
            <label htmlFor="idea-details">展开描述</label>
            <textarea
              id="idea-details"
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              placeholder="写清楚你的目标用户、核心场景、竞争优势、验证方法，以及你希望获得什么样的反馈。"
              rows={8}
            />
          </div>
          {error ? <p className="auth-form__error">{error}</p> : null}
          {message ? <p className="auth-form__success">{message}</p> : null}
          <div className="publish-panel__actions">
            <button className="auth-form__submit auth-form__submit--inline" type="submit" disabled={submitting}>
              {submitting ? '提交中...' : '提交审核'}
            </button>
            <span>提交后会进入审核流程，审核通过后才会在项目库公开展示。</span>
          </div>
        </form>

        <aside className="publish-panel__aside publish-panel__aside--page">
          <h3>发布建议</h3>
          <ul>
            <li>先写清楚目标用户是谁</li>
            <li>说明要解决的核心问题</li>
            <li>补充你设想中的变现方式</li>
            <li>留下希望获得的反馈方向</li>
          </ul>

          <div className="publish-aside__tips">
            <h4>适合发布什么</h4>
            <p>新产品灵感、功能雏形、垂直工具、社区平台、AI 工作流、行业数字化方案都可以发布。</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
