import { NavLink } from 'react-router-dom';
import type { ProjectItem } from '../api';

type ProjectCardProps = {
  project: ProjectItem;
};

const categoryCopy: Record<ProjectItem['category'], string> = {
  ai: '聚焦自动化、智能助手与企业提效场景。',
  ecommerce: '围绕选品、增长、履约与零售数字化展开。',
  tool: '面向团队协作、流程效率和业务工作台。',
  content: '服务创作者、社区运营与内容生产流程。'
};

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <article className="project-card">
      <div className="project-card__image-wrap">
        <img className="project-card__image" src={project.image} alt={project.title} />
      </div>
      <div className="project-card__body">
        <span className="project-card__category">{project.category.toUpperCase()}</span>
        <h3>{project.title}</h3>
        <p>{categoryCopy[project.category]}</p>
        <NavLink className="project-card__link" to={`/projects/${project.id}`}>
          查看详情
        </NavLink>
      </div>
    </article>
  );
}
