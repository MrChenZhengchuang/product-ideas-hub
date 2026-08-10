import type { ReactNode } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { AppIcon } from '@/components/AppIcon';
import './PageShell.scss';

type PageShellProps = {
  title: string;
  description: string;
  topBarTitle?: string;
  showTopBar?: boolean;
  showBackButton?: boolean;
  backFallbackUrl?: string;
  children?: ReactNode;
};

const tabPages = new Set(['/pages/home/index', '/pages/trends/index', '/pages/publish/index', '/pages/me/index']);

export function PageShell({ title, description, topBarTitle, showTopBar = false, showBackButton = false, backFallbackUrl, children }: PageShellProps) {
  const handleBack = () => {
    if (Taro.getCurrentPages().length > 1) {
      Taro.navigateBack();
      return;
    }

    if (!backFallbackUrl) {
      return;
    }

    if (tabPages.has(backFallbackUrl)) {
      Taro.switchTab({ url: backFallbackUrl });
      return;
    }

    Taro.navigateTo({ url: backFallbackUrl });
  };

  return (
    <View className="page-shell">
      {showTopBar ? (
        <View className="page-shell__topbar">
          {showBackButton ? (
            <View className="page-shell__back" onClick={handleBack}>
              <AppIcon name="arrow-left" size={18} />
            </View>
          ) : (
            <View className="page-shell__back-placeholder" />
          )}
          <Text className="page-shell__topbar-title">{topBarTitle || title}</Text>
          <View className="page-shell__back-placeholder" />
        </View>
      ) : null}
      <View className="page-shell__hero">
        <Text className="page-shell__title">{title}</Text>
        <Text className="page-shell__description">{description}</Text>
      </View>
      <View className="page-shell__content">{children}</View>
    </View>
  );
}
