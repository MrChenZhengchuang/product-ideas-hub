import { Text, View } from '@tarojs/components';
import { PageShell } from '@/features/shell/PageShell';
import './index.scss';

const trendItems = [
  {
    rank: 'TOP 1',
    title: 'AI 垂直助手',
    description: '更聚焦具体角色、具体动作、具体交付结果，而不是泛化问答。',
    signals: ['企业效率与自动化', '可量化交付', '更容易做付费闭环']
  },
  {
    rank: 'TOP 2',
    title: '电商增长工具',
    description: '围绕选品、素材、投放和转化优化的轻量工作台，依然有清晰机会。',
    signals: ['运营团队高频使用', '和业务收入直接挂钩', 'MVP 相对容易验证']
  },
  {
    rank: 'TOP 3',
    title: '创作者生产力',
    description: '选题池、内容拆解、账号协作、知识沉淀等方向会继续增长。',
    signals: ['内容团队协作刚需', '自然带来社区属性', '容易形成复用工作流']
  }
];

const evaluationRules = ['问题是否高频刚需', '用户是否愿意持续付费', '能否快速验证 MVP', '是否存在清晰的获客路径'];

export default function TrendsPage() {
  return (
    <PageShell title="趋势榜单" description="从项目热度、讨论频率和实际落地场景出发，整理当前更值得优先关注的产品方向。">
      <View className="mobile-trends__list">
        {trendItems.map((item) => (
          <View key={item.rank} className="mobile-trends__card">
            <Text className="mobile-trends__rank">{item.rank}</Text>
            <Text className="mobile-trends__title">{item.title}</Text>
            <Text className="mobile-trends__description">{item.description}</Text>
            <View className="mobile-trends__signals">
              {item.signals.map((signal) => (
                <View key={signal} className="mobile-trends__signal">
                  <Text>{signal}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>

      <View className="mobile-trends__rules">
        <Text className="mobile-trends__rules-title">判断标准</Text>
        {evaluationRules.map((rule) => (
          <Text key={rule} className="mobile-trends__rule-item">
            {rule}
          </Text>
        ))}
      </View>
    </PageShell>
  );
}
