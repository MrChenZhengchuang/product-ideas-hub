import { View, Text } from '@tarojs/components';
import './MigrationCards.scss';

const cards = [
  {
    title: '先跑 H5',
    body: '保留现有接口，先把首页、趋势、发布、我的迁进跨端壳子。'
  },
  {
    title: '再接小程序',
    body: '路由、存储、请求层都已经按 Taro 方式收口，后续直接补平台能力。'
  },
  {
    title: '最后看 App',
    body: '等业务跑顺，再决定是继续走 Taro RN 还是外层容器方案。'
  }
];

export function MigrationCards() {
  return (
    <View className="migration-cards">
      {cards.map((card) => (
        <View key={card.title} className="migration-cards__item">
          <Text className="migration-cards__title">{card.title}</Text>
          <Text className="migration-cards__body">{card.body}</Text>
        </View>
      ))}
    </View>
  );
}
