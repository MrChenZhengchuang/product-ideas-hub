import { useEffect, useState } from 'react';
import {
  AppstoreOutlined,
  DesktopOutlined,
  LaptopOutlined,
  LoadingOutlined,
  LockOutlined,
  LogoutOutlined,
  MailOutlined,
  MobileOutlined,
  PhoneOutlined,
  PlusOutlined,
  UserOutlined
} from '@ant-design/icons';
import {
  Avatar,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Typography,
  Upload,
  message
} from 'antd';
import type { UploadProps } from 'antd';
import {
  changeAdminPassword,
  bindAdminIntegration,
  fetchAdminDevices,
  fetchAdminIntegrations,
  fetchAdminProfile,
  offlineAdminDevice,
  unbindAdminIntegration,
  updateAdminProfile,
  uploadAdminImage,
  type AdminDeviceSession,
  type AdminIntegration,
  type AdminProfile,
  type CurrentAdmin
} from '../api';
import type { AdminPreferences } from '../preferences';

type AccountCenterPageProps = {
  currentAdmin: CurrentAdmin;
  refreshCurrentAdmin: () => Promise<CurrentAdmin>;
  onAvatarChange: (avatar: string) => void;
  preferences: AdminPreferences;
  onPreferencesChange: (preferences: AdminPreferences) => Promise<void>;
};

type ProfileFormValues = {
  name: string;
  phone: string;
  email: string;
  avatar: string;
};

type PasswordFormValues = {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type IntegrationFormValues = {
  accountName: string;
};

const COLOR_OPTIONS = [
  '#0f766e',
  '#1677ff',
  '#7c3aed',
  '#ea580c',
  '#dc2626'
];

function formatDateTime(value: string | null) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('zh-CN', { hour12: false });
}

function renderDeviceIcon(deviceType: string) {
  if (deviceType === 'mobile') {
    return <MobileOutlined />;
  }

  if (deviceType === 'desktop') {
    return <DesktopOutlined />;
  }

  return <LaptopOutlined />;
}

export function AccountCenterPage({
  currentAdmin,
  refreshCurrentAdmin,
  onAvatarChange,
  preferences,
  onPreferencesChange
}: AccountCenterPageProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [devices, setDevices] = useState<AdminDeviceSession[]>([]);
  const [integrations, setIntegrations] = useState<AdminIntegration[]>([]);
  const [loading, setLoading] = useState(false);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [integrationsLoading, setIntegrationsLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [bindingIntegration, setBindingIntegration] = useState<AdminIntegration | null>(null);
  const [savingIntegration, setSavingIntegration] = useState(false);
  const [profileForm] = Form.useForm<ProfileFormValues>();
  const [passwordForm] = Form.useForm<PasswordFormValues>();
  const [integrationForm] = Form.useForm<IntegrationFormValues>();

  const loadProfile = async () => {
    setLoading(true);
    try {
      const nextProfile = await fetchAdminProfile();
      setProfile(nextProfile);
      const nextAvatar = nextProfile.avatar || '';
      setAvatarUrl(nextAvatar);
      profileForm.setFieldsValue({
        name: nextProfile.name,
        phone: nextProfile.phone,
        email: nextProfile.email,
        avatar: nextAvatar
      });
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '个人资料加载失败');
    } finally {
      setLoading(false);
    }
  };

  const loadDevices = async () => {
    setDevicesLoading(true);
    try {
      const nextDevices = await fetchAdminDevices();
      setDevices(nextDevices);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '在线设备加载失败');
    } finally {
      setDevicesLoading(false);
    }
  };

  const loadIntegrations = async () => {
    setIntegrationsLoading(true);
    try {
      const nextIntegrations = await fetchAdminIntegrations();
      setIntegrations(nextIntegrations);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '第三方应用加载失败');
    } finally {
      setIntegrationsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    loadDevices();
    loadIntegrations();
  }, []);

  const handleAvatarUpload: UploadProps['beforeUpload'] = async (file) => {
    const isImage = file.type.startsWith('image/');

    if (!isImage) {
      messageApi.error('仅支持上传图片文件');
      return Upload.LIST_IGNORE;
    }

    if (file.size > 2 * 1024 * 1024) {
      messageApi.error('图片大小不能超过 2MB');
      return Upload.LIST_IGNORE;
    }

    setUploadingAvatar(true);

    try {
      const result = await uploadAdminImage(file);
      setAvatarUrl(result.url);
      profileForm.setFieldValue('avatar', result.url);
      onAvatarChange(result.url);
      messageApi.success('头像上传成功');
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '头像上传失败');
    } finally {
      setUploadingAvatar(false);
    }

    return Upload.LIST_IGNORE;
  };

  const handleSaveProfile = async () => {
    const values = await profileForm.validateFields();
    setSavingProfile(true);

    try {
      await updateAdminProfile(values);
      await Promise.all([loadProfile(), refreshCurrentAdmin()]);
      messageApi.success('个人资料已保存');
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '个人资料保存失败');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    const values = await passwordForm.validateFields();
    setSavingPassword(true);

    try {
      await changeAdminPassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword
      });
      passwordForm.resetFields();
      messageApi.success('密码已更新，请妥善保管');
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '密码修改失败');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleOfflineDevice = async (deviceId: number) => {
    try {
      await offlineAdminDevice(deviceId);
      await loadDevices();
      messageApi.success('设备已下线');
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '设备下线失败');
    }
  };

  const handlePreferencesUpdate = async (nextPreferences: AdminPreferences) => {
    setSavingPreferences(true);

    try {
      await onPreferencesChange(nextPreferences);
      messageApi.success('布局设置已保存');
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '布局设置保存失败');
    } finally {
      setSavingPreferences(false);
    }
  };

  const openBindModal = (integration: AdminIntegration) => {
    setBindingIntegration(integration);
    integrationForm.setFieldsValue({
      accountName: integration.accountName || ''
    });
  };

  const handleBindIntegration = async () => {
    if (!bindingIntegration) {
      return;
    }

    const values = await integrationForm.validateFields();
    setSavingIntegration(true);

    try {
      await bindAdminIntegration(bindingIntegration.id, values);
      setBindingIntegration(null);
      integrationForm.resetFields();
      await loadIntegrations();
      messageApi.success('应用已绑定');
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '应用绑定失败');
    } finally {
      setSavingIntegration(false);
    }
  };

  const handleUnbindIntegration = async (integrationId: number) => {
    try {
      await unbindAdminIntegration(integrationId);
      await loadIntegrations();
      messageApi.success('应用已解绑');
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '应用解绑失败');
    }
  };

  return (
    <div className="account-center">
      {contextHolder}
      <Row gutter={[16, 16]} align="stretch">
        <Col xs={24} xl={7}>
          <Card loading={loading} className="account-center__sidebar">
            <div className="account-center__hero">
              <Avatar size={88} src={avatarUrl || undefined}>
                {(profile?.name || currentAdmin.name).slice(0, 1)}
              </Avatar>
              <div>
                <Typography.Title level={4} style={{ marginBottom: 4 }}>
                  {profile?.name || currentAdmin.name}
                </Typography.Title>
                <Typography.Text type="secondary">{profile?.account || currentAdmin.account || '-'}</Typography.Text>
              </div>
            </div>
            <Space wrap size={[8, 8]}>
              <Tag color="blue">{profile?.role || currentAdmin.role}</Tag>
              <Tag>{profile?.status || currentAdmin.status || '启用'}</Tag>
            </Space>
            <Descriptions column={1} size="small" className="account-center__meta">
              <Descriptions.Item label="所属部门">{profile?.departmentName || currentAdmin.departmentName || '-'}</Descriptions.Item>
              <Descriptions.Item label="手机号">{profile?.phone || '-'}</Descriptions.Item>
              <Descriptions.Item label="邮箱">{profile?.email || '-'}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{formatDateTime(profile?.createdAt || null)}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} xl={17}>
          <Card loading={loading}>
            <Tabs
              items={[
                {
                  key: 'profile',
                  label: '基本资料',
                  children: (
                    <Form
                      form={profileForm}
                      layout="vertical"
                      className="account-center__form"
                      initialValues={{ name: '', phone: '', email: '', avatar: '' }}
                    >
                      <Form.Item name="avatar" label="头像">
                        <div className="account-center__avatar-upload">
                          <Upload
                            listType="picture-card"
                            showUploadList={false}
                            accept="image/*"
                            beforeUpload={handleAvatarUpload}
                            disabled={uploadingAvatar}
                          >
                            {avatarUrl ? (
                              <img src={avatarUrl} alt="头像" className="account-center__avatar-preview" />
                            ) : (
                              <button type="button" className="account-center__avatar-trigger">
                                {uploadingAvatar ? <LoadingOutlined /> : <PlusOutlined />}
                                <span>{uploadingAvatar ? '上传中' : '上传头像'}</span>
                              </button>
                            )}
                          </Upload>
                          <Typography.Text type="secondary">支持 JPG、PNG、GIF、WebP，大小不超过 2MB</Typography.Text>
                        </div>
                      </Form.Item>
                      <Row gutter={16}>
                        <Col xs={24} md={12}>
                          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
                            <Input prefix={<UserOutlined />} placeholder="请输入姓名" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item label="账号">
                            <Input value={profile?.account || currentAdmin.account || ''} disabled />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item
                            name="phone"
                            label="手机号"
                            rules={[{ pattern: /^$|^1\d{10}$/, message: '请输入正确的手机号' }]}
                          >
                            <Input prefix={<PhoneOutlined />} placeholder="请输入手机号" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item
                            name="email"
                            label="邮箱"
                            rules={[{ type: 'email', message: '请输入正确的邮箱地址' }]}
                          >
                            <Input prefix={<MailOutlined />} placeholder="请输入邮箱地址" />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Button type="primary" onClick={handleSaveProfile} loading={savingProfile}>
                        保存资料
                      </Button>
                    </Form>
                  )
                },
                {
                  key: 'password',
                  label: '修改密码',
                  children: (
                    <Form form={passwordForm} layout="vertical" className="account-center__form">
                      <Row gutter={16}>
                        <Col xs={24} md={12}>
                          <Form.Item name="oldPassword" label="当前密码" rules={[{ required: true, message: '请输入当前密码' }]}>
                            <Input.Password prefix={<LockOutlined />} placeholder="请输入当前密码" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item
                            name="newPassword"
                            label="新密码"
                            rules={[
                              { required: true, message: '请输入新密码' },
                              { min: 6, message: '新密码至少需要 6 位' }
                            ]}
                          >
                            <Input.Password prefix={<LockOutlined />} placeholder="请输入新密码" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item
                            name="confirmPassword"
                            label="确认新密码"
                            dependencies={['newPassword']}
                            rules={[
                              { required: true, message: '请再次输入新密码' },
                              ({ getFieldValue }) => ({
                                validator(_, value) {
                                  if (!value || getFieldValue('newPassword') === value) {
                                    return Promise.resolve();
                                  }

                                  return Promise.reject(new Error('两次输入的新密码不一致'));
                                }
                              })
                            ]}
                          >
                            <Input.Password prefix={<LockOutlined />} placeholder="请再次输入新密码" />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Button type="primary" onClick={handleChangePassword} loading={savingPassword}>
                        更新密码
                      </Button>
                    </Form>
                  )
                },
                {
                  key: 'preferences',
                  label: '布局设置',
                  children: (
                    <div className="account-preferences">
                      <div className="account-preferences__section">
                        <Typography.Text strong>主题主色</Typography.Text>
                        <div className="account-preferences__swatches">
                          {COLOR_OPTIONS.map((color) => (
                            <button
                              key={color}
                              type="button"
                              className={
                                preferences.colorPrimary === color
                                  ? 'account-preferences__swatch account-preferences__swatch--active'
                                  : 'account-preferences__swatch'
                              }
                              style={{ backgroundColor: color }}
                              aria-label={`切换主色 ${color}`}
                              disabled={savingPreferences}
                              onClick={() => handlePreferencesUpdate({ ...preferences, colorPrimary: color })}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="account-preferences__item">
                        <div>
                          <Typography.Text strong>显示页签栏</Typography.Text>
                          <Typography.Paragraph type="secondary">
                            保留页面访问痕迹，方便在多个页面之间快速切换。
                          </Typography.Paragraph>
                        </div>
                        <Switch
                          checked={preferences.showPageTabs}
                          loading={savingPreferences}
                          onChange={(checked) => handlePreferencesUpdate({ ...preferences, showPageTabs: checked })}
                        />
                      </div>
                      <div className="account-preferences__item">
                        <div>
                          <Typography.Text strong>紧凑内容模式</Typography.Text>
                          <Typography.Paragraph type="secondary">
                            收紧内容区间距，适合信息密度更高的后台操作。
                          </Typography.Paragraph>
                        </div>
                        <Switch
                          checked={preferences.compactContent}
                          loading={savingPreferences}
                          onChange={(checked) => handlePreferencesUpdate({ ...preferences, compactContent: checked })}
                        />
                      </div>
                    </div>
                  )
                },
                {
                  key: 'devices',
                  label: '在线设备',
                  children: (
                    <Table<AdminDeviceSession>
                      rowKey="id"
                      loading={devicesLoading}
                      dataSource={devices}
                      pagination={false}
                      scroll={{ x: 760 }}
                      columns={[
                        {
                          title: '设备',
                          dataIndex: 'deviceName',
                          render: (_value, record) => (
                            <Space>
                              {renderDeviceIcon(record.deviceType)}
                              <span>{record.deviceName}</span>
                              {record.isCurrent ? <Tag color="green">当前设备</Tag> : null}
                            </Space>
                          )
                        },
                        {
                          title: '状态',
                          dataIndex: 'status',
                          render: (value: string) => <Tag color={value === '在线' ? 'blue' : 'default'}>{value}</Tag>
                        },
                        { title: 'IP', dataIndex: 'ipAddress', render: (value: string) => value || '-' },
                        { title: '最近活跃', dataIndex: 'lastActiveAt', render: (value: string | null) => formatDateTime(value) },
                        {
                          title: '操作',
                          key: 'actions',
                          render: (_value, record) =>
                            record.isCurrent ? (
                              <Typography.Text type="secondary">当前设备</Typography.Text>
                            ) : (
                              <Popconfirm title="确认下线这个设备吗？" onConfirm={() => handleOfflineDevice(record.id)}>
                                <Button type="link" danger icon={<LogoutOutlined />}>
                                  下线
                                </Button>
                              </Popconfirm>
                            )
                        }
                      ]}
                    />
                  )
                },
                {
                  key: 'integrations',
                  label: '第三方应用',
                  children: integrations.length ? (
                    <div className="integration-grid">
                      {integrations.map((item) => (
                        <Card key={item.id} size="small" className="integration-card">
                          <Space align="start" className="integration-card__header">
                            <Avatar shape="square" size={48} icon={<AppstoreOutlined />} />
                            <div className="integration-card__meta">
                              <Space wrap size={[8, 8]}>
                                <Typography.Text strong>{item.appName}</Typography.Text>
                                <Tag>{item.appType}</Tag>
                                <Tag color={item.status === '启用' ? 'blue' : 'orange'}>{item.status}</Tag>
                              </Space>
                              <Typography.Paragraph type="secondary">{item.description || '-'}</Typography.Paragraph>
                            </div>
                          </Space>
                          <Descriptions column={1} size="small" className="integration-card__details">
                            <Descriptions.Item label="绑定状态">
                              {item.isBound ? <Tag color="green">已绑定</Tag> : <Tag>未绑定</Tag>}
                            </Descriptions.Item>
                            <Descriptions.Item label="关联账号">{item.accountName || '-'}</Descriptions.Item>
                            <Descriptions.Item label="绑定时间">{formatDateTime(item.boundAt)}</Descriptions.Item>
                          </Descriptions>
                          <Space>
                            <Button
                              type="primary"
                              ghost
                              disabled={item.status !== '启用'}
                              onClick={() => openBindModal(item)}
                            >
                              {item.isBound ? '更新绑定' : '立即绑定'}
                            </Button>
                            {item.isBound ? (
                              <Popconfirm title="确认解绑这个应用吗？" onConfirm={() => handleUnbindIntegration(item.id)}>
                                <Button danger type="text">
                                  解绑
                                </Button>
                              </Popconfirm>
                            ) : null}
                          </Space>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无可用应用" />
                  )
                }
              ]}
            />
          </Card>
        </Col>
      </Row>
      <Modal
        open={Boolean(bindingIntegration)}
        title={bindingIntegration ? `${bindingIntegration.appName} 绑定设置` : '绑定设置'}
        onCancel={() => {
          setBindingIntegration(null);
          integrationForm.resetFields();
        }}
        onOk={handleBindIntegration}
        confirmLoading={savingIntegration}
        okText="保存绑定"
      >
        <Form form={integrationForm} layout="vertical">
          <Form.Item
            name="accountName"
            label="关联账号"
            rules={[{ required: true, message: '请输入关联账号' }]}
          >
            <Input placeholder="请输入第三方应用中的账号标识" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
