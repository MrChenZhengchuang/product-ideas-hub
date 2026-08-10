import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ProjectCard } from '../components/ProjectCard';
import {
  fetchCategories,
  fetchProjects,
  type CategoryItem,
  type ProjectCategory,
  type ProjectItem
} from '../api';

export function HomePage() {
  const [keyword, setKeyword] = useState('');
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<ProjectCategory>('all');
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch(() => {
        setCategories([{ key: 'all', label: '全部项目' }]);
      });
  }, []);

  useEffect(() => {
    let active = true;

    if (projects.length === 0) {
      setInitialLoading(true);
    } else {
      setIsRefreshing(true);
    }

    fetchProjects({
      keyword,
      category: activeCategory
    })
      .then((nextProjects) => {
        if (!active) {
          return;
        }

        setProjects(nextProjects);
      })
      .finally(() => {
        if (!active) {
          return;
        }

        setInitialLoading(false);
        setIsRefreshing(false);
      });

    return () => {
      active = false;
    };
  }, [activeCategory, keyword]);

  return (
    <>
      <section className="hero">
        <div className="hero__content">
          <p className="hero__eyebrow">Idea Discovery Platform</p>
          <h1>把零散灵感整理成真正可执行的产品机会</h1>
          <p className="hero__desc">
            聚合 AI、电商、效率工具、内容社区等方向的项目点子，帮助团队快速浏览、筛选、评估下一个值得投入的产品方向。
          </p>

          <div className="hero__actions">
            <a className="hero__primary" href="#project-library">
              进入项目库
            </a>
            <NavLink className="hero__secondary" to="/publish">
              写下想法
            </NavLink>
          </div>

          <div className="hero__metrics">
            <div className="hero-metric">
              <strong>{projects.length || 24}+</strong>
              <span>精选方向</span>
            </div>
            <div className="hero-metric">
              <strong>{categories.length || 4}</strong>
              <span>热门分类</span>
            </div>
            <div className="hero-metric">
              <strong>7 天</strong>
              <span>趋势更新</span>
            </div>
          </div>
        </div>

        <div className="hero-panel">
          <div className="hero-panel__card">
            <span className="hero-panel__label">本周热门方向</span>
            <h2>AI 商业工具</h2>
            <p>从内容生成到垂类助手，增长最快的项目集中在高频、可交付、可变现的工作流提效场景。</p>
            <ul className="hero-panel__list">
              <li>企业效率与自动化</li>
              <li>跨境与零售数字化</li>
              <li>创作者生产力工具</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="project-library" className="content-section">
        <div className="section-heading">
          <div>
            <p className="section-heading__eyebrow">Project Library</p>
            <h2>项目库</h2>
            <p>按行业和关键词快速筛选，先找到值得讨论的方向，再进入验证和落地阶段。</p>
          </div>
          {isRefreshing ? <span className="section-heading__status">更新中...</span> : null}
        </div>

        <div className="toolbar">
          <div className="search-panel">
            <label className="search-panel__label" htmlFor="project-search">
              搜索项目
            </label>
            <input
              id="project-search"
              className="search-input"
              type="search"
              placeholder="搜索项目标题，比如 AI、跨境、电商、选题"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </div>

          <div className="tabs">
            {categories.map((category) => (
              <button
                key={category.key}
                type="button"
                className={category.key === activeCategory ? 'tab is-active' : 'tab'}
                onClick={() => setActiveCategory(category.key)}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        <section className="project-grid">
          {initialLoading ? <div className="empty-state">正在加载项目...</div> : null}
          {!initialLoading && projects.length === 0 ? <div className="empty-state">暂无符合条件的项目</div> : null}
          {projects.map((project) => <ProjectCard key={project.id} project={project} />)}
        </section>
      </section>
    </>
  );
}
