import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { CaptchaPayload, ClientUser } from '../api';
import { fetchClientCaptcha, loginClientUser, registerClientUser } from '../api';
import { setClientToken } from '../auth';

type AuthPageProps = {
  onAuthSuccess: (user: ClientUser) => void;
};

export function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || '/';
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
      onAuthSuccess(result.user);
      navigate(redirectTo, { replace: true });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '操作失败，请稍后重试');
      setCaptchaCode('');
      loadCaptcha().catch(() => undefined);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-card">
        <div className="auth-card__tabs">
          <button type="button" className={mode === 'login' ? 'auth-tab is-active' : 'auth-tab'} onClick={() => setMode('login')}>
            登录
          </button>
          <button type="button" className={mode === 'register' ? 'auth-tab is-active' : 'auth-tab'} onClick={() => setMode('register')}>
            注册
          </button>
        </div>

        <div className="auth-card__header">
          <p className="section-heading__eyebrow">{mode === 'login' ? 'Welcome Back' : 'Create Account'}</p>
          <h1>{mode === 'login' ? '登录后发布项目和查看详情' : '注册一个账号开始分享你的想法'}</h1>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'register' ? (
            <div className="publish-field">
              <label htmlFor="auth-nickname">昵称</label>
              <input id="auth-nickname" value={nickname} onChange={(event) => setNickname(event.target.value)} placeholder="输入你的昵称" />
            </div>
          ) : null}

          <div className="publish-field">
            <label htmlFor="auth-phone">手机号</label>
            <input id="auth-phone" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="输入手机号" />
          </div>

          <div className="publish-field">
            <label htmlFor="auth-password">密码</label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="输入密码"
            />
          </div>

          <div className="publish-field">
            <label htmlFor="auth-captcha">验证码</label>
            <div className="auth-captcha">
              <input
                id="auth-captcha"
                value={captchaCode}
                onChange={(event) => setCaptchaCode(event.target.value)}
                placeholder="输入验证码"
              />
              <button
                className="auth-captcha__box"
                type="button"
                title="点击刷新验证码"
                onClick={() => loadCaptcha().catch(() => setError('验证码加载失败，请稍后重试'))}
                dangerouslySetInnerHTML={{ __html: captcha?.svg || '' }}
              />
            </div>
          </div>

          {error ? <p className="auth-form__error">{error}</p> : null}

          <button className="auth-form__submit" type="submit" disabled={submitting}>
            {submitting ? '提交中...' : mode === 'login' ? '登录' : '注册并登录'}
          </button>
        </form>
      </div>
    </section>
  );
}
