import { Image, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { AppIcon } from '@/components/AppIcon';
import { routes } from '@/constants/routes';
import type { ProjectItem } from '@/services/client-api';
import './ProjectCard.scss';

type ProjectCardProps = {
  project: ProjectItem;
};

const categoryCopy: Record<ProjectItem['category'], string> = {
  ai: '聚焦自动化、智能助手与企业提效场景。',
  ecommerce: '围绕选品、增长、履约与零售数字化展开。',
  tool: '面向团队协作、流程效率和业务工作台。',
  content: '服务创作者、社区运营与内容生产流程。'
};

const categoryLabel: Record<ProjectItem['category'], string> = {
  ai: 'AI 应用',
  ecommerce: '电商零售',
  tool: '效率工具',
  content: '内容社区'
};

const categoryIcon: Record<ProjectItem['category'], 'ai' | 'bag' | 'briefcase' | 'message'> = {
  ai: 'ai',
  ecommerce: 'bag',
  tool: 'briefcase',
  content: 'message'
};

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <View className="mobile-project-card" onClick={() => Taro.navigateTo({ url: `${routes.projectDetail}?id=${project.id}` })}>
      <Image className="mobile-project-card__image" src={project.image} mode="aspectFill" />
      <View className="mobile-project-card__body">
        <View className="mobile-project-card__category-row">
          <View className="mobile-project-card__category-badge">
            <AppIcon className="mobile-project-card__category-icon" name={categoryIcon[project.category]} size={16} />
            <Text className="mobile-project-card__category">{categoryLabel[project.category]}</Text>
          </View>
        </View>
        <Text className="mobile-project-card__title">{project.title}</Text>
        <Text className="mobile-project-card__description">{project.description || categoryCopy[project.category]}</Text>
        <View className="mobile-project-card__footer">
          <Text className="mobile-project-card__link">查看详情</Text>
          <AppIcon className="mobile-project-card__link-icon" name="arrow-up-right" size={18} />
        </View>
      </View>
    </View>
  );
}
