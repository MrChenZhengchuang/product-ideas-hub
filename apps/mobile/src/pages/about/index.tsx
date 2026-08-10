import { Text, View } from '@tarojs/components';
import { PageShell } from '@/features/shell/PageShell';
import './index.scss';

const principles = ['鼓励真实问题导向', '强调可执行和可验证', '支持公开讨论和协作', '让好点子更快被看到'];

export default function AboutPage() {
  return (
    <PageShell
      title="关于平台"
      description="我们希望把零散的灵感、经验和行业洞察沉淀成可以被讨论、被验证、被共创的项目想法。"
      topBarTitle="关于平台"
      showTopBar
      showBackButton
      backFallbackUrl="/pages/me/index"
    >
      <View className="mobile-about__section">
        <Text className="mobile-about__section-title">我们在做什么</Text>
        <Text className="mobile-about__section-body">
          提供项目浏览、发布、筛选、趋势整理和详情查看，让好想法不只停留在聊天记录和脑海里。
        </Text>
      </View>

      <View className="mobile-about__section">
        <Text className="mobile-about__section-title">适合谁使用</Text>
        <Text className="mobile-about__section-body">
          独立开发者、产品经理、创业团队、运营同学，以及任何对新产品机会感兴趣的人。
        </Text>
      </View>

      <View className="mobile-about__principles">
        <Text className="mobile-about__section-title">平台原则</Text>
        {principles.map((item) => (
          <View key={item} className="mobile-about__principle">
            <Text>{item}</Text>
          </View>
        ))}
      </View>
    </PageShell>
  );
}
