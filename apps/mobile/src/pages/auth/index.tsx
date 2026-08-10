import { Button, Input, RichText, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useEffect, useState } from 'react';
import { setClientToken } from '@/auth';
import { PageShell } from '@/features/shell/PageShell';
import { fetchClientCaptcha, loginClientUser, registerClientUser, type CaptchaPayload } from '@/services/client-api';
import './index.scss';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const [captcha, setCaptcha] = useState<CaptchaPayload | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadCaptcha = async () => {
    const result = await fetchClientCaptcha();
    setCaptcha(result);
  };

  useEffect(() => {
    loadCaptcha().catch(() => setError('验证码加载失败，请刷新重试'));
  }, []);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');

    try {
      if (!captcha) {
        throw new Error('验证码加载失败，请刷新重试');
      }

      const result =
        mode === 'login'
          ? await loginClientUser({ phone, password, captchaId: captcha.captchaId, captchaCode })
          : await registerClientUser({ phone, password, nickname, captchaId: captcha.captchaId, captchaCode });

      setClientToken(result.token);
      Taro.showToast({ title: mode === 'login' ? '登录成功' : '注册成功', icon: 'success' });
      Taro.switchTab({ url: '/pages/home/index' });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '操作失败，请稍后重试');
      setCaptchaCode('');
      loadCaptcha().catch(() => undefined);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell
      title={mode === 'login' ? '登录' : '注册'}
      description="登录后可以查看项目详情、收藏点赞，也能继续发布自己的项目。"
      topBarTitle="登录 / 注册"
      showTopBar
      showBackButton
      backFallbackUrl="/pages/home/index"
    >
      <View className="mobile-auth__tabs">
        <View className={mode === 'login' ? 'mobile-auth__tab mobile-auth__tab--active' : 'mobile-auth__tab'} onClick={() => setMode('login')}>
          <Text>登录</Text>
        </View>
        <View
          className={mode === 'register' ? 'mobile-auth__tab mobile-auth__tab--active' : 'mobile-auth__tab'}
          onClick={() => setMode('register')}
        >
          <Text>注册</Text>
        </View>
      </View>

      <View className="mobile-auth__form">
        {mode === 'register' ? (
          <Input className="mobile-auth__input" type="text" placeholder="输入你的昵称" value={nickname} onInput={(event) => setNickname(event.detail.value)} />
        ) : null}
        <Input className="mobile-auth__input" type="number" placeholder="输入手机号" value={phone} onInput={(event) => setPhone(event.detail.value)} />
        <Input
          className="mobile-auth__input"
          password
          placeholder="输入密码"
          value={password}
          onInput={(event) => setPassword(event.detail.value)}
        />

        <View className="mobile-auth__captcha">
          <Input
            className="mobile-auth__input mobile-auth__input--captcha"
            type="text"
            placeholder="输入验证码"
            value={captchaCode}
            onInput={(event) => setCaptchaCode(event.detail.value)}
          />
          <View className="mobile-auth__captcha-box" onClick={() => loadCaptcha().catch(() => setError('验证码加载失败，请稍后重试'))}>
            {process.env.TARO_ENV === 'h5' ? <RichText nodes={captcha?.svg || ''} /> : <Text>点我刷新验证码</Text>}
          </View>
        </View>

        {error ? <Text className="mobile-auth__error">{error}</Text> : null}

        <Button className="mobile-auth__submit" loading={submitting} onClick={handleSubmit}>
          {mode === 'login' ? '登录' : '注册并登录'}
        </Button>

        <Text className="mobile-auth__hint">小程序端后面建议把 SVG 验证码改成图片或短信验证码，这样体验会更顺。</Text>
      </View>
    </PageShell>
  );
}
