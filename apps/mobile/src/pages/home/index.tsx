import { Input, ScrollView, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useEffect, useState } from 'react';
import { AppIcon } from '@/components/AppIcon';
import { ProjectCard } from '@/components/ProjectCard';
import { routes } from '@/constants/routes';
import { PageShell } from '@/features/shell/PageShell';
import { fetchCategories, fetchProjects, type CategoryItem, type ProjectCategory, type ProjectItem } from '@/services/client-api';
import './index.scss';

const categoryIcons: Record<ProjectCategory, 'compass' | 'ai' | 'bag' | 'briefcase' | 'message'> = {
  all: 'compass',
  ai: 'ai',
  ecommerce: 'bag',
  tool: 'briefcase',
  content: 'message'
};

export default function HomePage() {
  const [keyword, setKeyword] = useState('');
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<ProjectCategory>('all');
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

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
      setRefreshing(true);
    }

    setError('');

    fetchProjects({ keyword, category: activeCategory })
      .then((nextProjects) => {
        if (!active) {
          return;
        }

        setProjects(nextProjects);
      })
      .catch((loadError) => {
        if (!active) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : '项目加载失败');
      })
      .finally(() => {
        if (!active) {
          return;
        }

        setInitialLoading(false);
        setRefreshing(false);
      });

    return () => {
      active = false;
    };
  }, [activeCategory, keyword]);

  return (
    <PageShell title="产品点子" description="按分类和关键词快速筛选项目方向，先找到值得讨论的点子，再进入验证和落地。">
      <View className="mobile-home__toolbar">
        <View className="mobile-home__search-wrap">
          <View className="mobile-home__search-icon">
            <AppIcon name="search" size={18} />
          </View>
          <Input
            className="mobile-home__search"
            type="text"
            placeholder="搜索项目标题，比如 AI、跨境、电商、选题"
            value={keyword}
            onInput={(event) => setKeyword(event.detail.value)}
          />
        </View>
        <ScrollView className="mobile-home__tabs" scrollX enhanced showScrollbar={false}>
          <View className="mobile-home__tabs-inner">
            {categories.map((category) => (
              <View
                key={category.key}
                className={category.key === activeCategory ? 'mobile-home__tab mobile-home__tab--active' : 'mobile-home__tab'}
                onClick={() => setActiveCategory(category.key)}
              >
                <AppIcon className="mobile-home__tab-icon" name={categoryIcons[category.key]} size={16} />
                <Text>{category.label}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      <View className="mobile-home__meta">
        <View className="mobile-home__meta-copy">
          <Text className="mobile-home__meta-title">{refreshing ? '更新中...' : `共 ${projects.length} 个项目方向`}</Text>
          <Text className="mobile-home__meta-subtitle">优先浏览已经能说清用户和场景的点子</Text>
        </View>
        <View className="mobile-home__publish-link" onClick={() => Taro.switchTab({ url: routes.publish })}>
          <Text>去发布</Text>
          <AppIcon className="mobile-home__publish-icon" name="arrow-up-right" size={18} />
        </View>
      </View>

      <View className="mobile-home__list">
        {initialLoading ? <Text className="mobile-home__empty">正在加载项目...</Text> : null}
        {!initialLoading && error ? <Text className="mobile-home__empty">{error}</Text> : null}
        {!initialLoading && !error && projects.length === 0 ? <Text className="mobile-home__empty">暂无符合条件的项目</Text> : null}
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </View>
    </PageShell>
  );
}
