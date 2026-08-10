import { useEffect, useRef, useState } from 'react';
import { Button, Card, Form, Input, Space, Typography, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { fetchCaptcha, loginAdmin, type CurrentAdmin, type CaptchaPayload } from '../api';
import { clearAdminToken, setAdminToken } from '../auth';

type LoginPageProps = {
  onLoginSuccess: (admin: CurrentAdmin) => void;
  refreshCurrentAdmin: () => Promise<CurrentAdmin>;
};

export function LoginPage({ onLoginSuccess, refreshCurrentAdmin }: LoginPageProps) {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [captcha, setCaptcha] = useState<CaptchaPayload | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const captchaInflightRef = useRef<Promise<CaptchaPayload> | null>(null);

  const loadCaptcha = async (force = false) => {
    if (force) {
      captchaInflightRef.current = null;
    }

    if (!captchaInflightRef.current) {
      captchaInflightRef.current = fetchCaptcha().finally(() => {
        captchaInflightRef.current = null;
      });
    }

    const result = await captchaInflightRef.current;
    setCaptcha(result);
  };

  useEffect(() => {
    clearAdminToken();

    form.setFieldsValue({
      account: 'admin',
      password: 'demo1234',
      captchaCode: ''
    });

    loadCaptcha().catch(() => {
      messageApi.error('验证码加载失败');
    });
    // 开发环境 StrictMode 会触发两次 mount；验证码请求已做并发去重
  }, []);

  const handleFinish = async (values: { account: string; password: string; captchaCode: string }) => {
    if (!captcha) {
      return;
    }

    setSubmitting(true);

    try {
      const result = await loginAdmin({
        account: values.account,
        password: values.password,
        captchaId: captcha.captchaId,
        captchaCode: values.captchaCode
      });

      setAdminToken(result.token);
      const admin = await refreshCurrentAdmin();
      onLoginSuccess(admin);
      messageApi.success('登录成功');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '登录失败，请稍后重试');
      form.setFieldValue('captchaCode', '');
      loadCaptcha(true).catch(() => undefined);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      {contextHolder}
      <div className="login-hero">
        <Typography.Text className="login-hero__eyebrow">Admin Access</Typography.Text>
        <Typography.Title className="login-hero__title">项目后台管理系统</Typography.Title>
        <Typography.Paragraph className="login-hero__desc">
          登录后进入系统用户、角色、网站用户和菜单管理中心。
        </Typography.Paragraph>
      </div>

      <Card className="login-card" variant="borderless">
        <Space direction="vertical" size={20} style={{ width: '100%' }}>
          <div className="login-card__header">
            <Typography.Title level={3}>登录</Typography.Title>
          </div>

          <Form
            form={form}
            layout="horizontal"
            requiredMark={false}
            onFinish={handleFinish}
            className="login-form"
          >
            <Form.Item name="account" rules={[{ required: true, message: '请输入账号' }]}>
              <Input className="login-input" placeholder="请输入后台账号" />
            </Form.Item>

            <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password className="login-input" placeholder="请输入密码" />
            </Form.Item>

            <Form.Item>
              <div className="login-field-wrap">
                <div className="captcha-row">
                  <Form.Item name="captchaCode" rules={[{ required: true, message: '请输入验证码' }]} noStyle>
                    <Input className="login-input captcha-input" placeholder="输入验证码" />
                  </Form.Item>
                  <div
                    className="captcha-box"
                    role="button"
                    tabIndex={0}
                    title="点击刷新验证码"
                    dangerouslySetInnerHTML={{ __html: captcha?.svg || '' }}
                    onClick={() => loadCaptcha(true)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        loadCaptcha(true).catch(() => undefined);
                      }
                    }}
                  />
                </div>
              </div>
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block size="large" loading={submitting} className="login-submit">
                登录管理系统
              </Button>
            </Form.Item>
          </Form>
        </Space>
      </Card>
    </div>
  );
}
