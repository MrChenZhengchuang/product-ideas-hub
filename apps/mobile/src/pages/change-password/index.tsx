import { Button, Input, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState } from 'react';
import { getClientToken } from '@/auth';
import { routes } from '@/constants/routes';
import { PageShell } from '@/features/shell/PageShell';
import { changeClientPassword, isAuthRedirectError } from '@/services/client-api';
import './index.scss';

export default function ChangePasswordPage() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!getClientToken()) {
    return (
      <PageShell
        title="修改密码"
        description="需要先登录，才能修改你的账号密码。"
        topBarTitle="修改密码"
        showTopBar
        showBackButton
        backFallbackUrl={routes.me}
      >
        <Button onClick={() => Taro.navigateTo({ url: routes.auth })}>去登录</Button>
      </PageShell>
    );
  }

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      await changeClientPassword({ oldPassword, newPassword });
      setMessage('密码修改成功');
      setOldPassword('');
      setNewPassword('');
      setTimeout(() => Taro.switchTab({ url: routes.me }), 800);
    } catch (submitError) {
      if (isAuthRedirectError(submitError)) {
        return;
      }

      setError(submitError instanceof Error ? submitError.message : '密码修改失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell
      title="修改密码"
      description="更新账号密码，确保你的发布记录和个人数据更安全。"
      topBarTitle="修改密码"
      showTopBar
      showBackButton
      backFallbackUrl={routes.me}
    >
      <View className="mobile-password__form">
        <Input
          className="mobile-password__input"
          password
          placeholder="输入原密码"
          value={oldPassword}
          onInput={(event) => setOldPassword(event.detail.value)}
        />
        <Input
          className="mobile-password__input"
          password
          placeholder="输入新密码"
          value={newPassword}
          onInput={(event) => setNewPassword(event.detail.value)}
        />
        {error ? <Text className="mobile-password__error">{error}</Text> : null}
        {message ? <Text className="mobile-password__message">{message}</Text> : null}
        <Button className="mobile-password__submit" loading={submitting} onClick={handleSubmit}>
          确认修改
        </Button>
      </View>
    </PageShell>
  );
}
