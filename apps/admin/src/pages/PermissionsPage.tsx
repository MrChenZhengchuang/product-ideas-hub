import { useEffect, useState } from 'react';
import { LockOutlined, TeamOutlined, UserOutlined, UserSwitchOutlined } from '@ant-design/icons';
import { Card, Col, Row, Space, Tag, Typography } from 'antd';
import { fetchPermissionGroups, type PermissionGroup } from '../api';

const iconMap = {
  'system-user': UserOutlined,
  role: TeamOutlined,
  'site-user': UserSwitchOutlined,
  permission: LockOutlined
};

export function PermissionsPage() {
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);

  useEffect(() => {
    fetchPermissionGroups().then(setPermissionGroups);
  }, []);

  return (
    <div>
      <Typography.Title level={3}>权限管理</Typography.Title>
      <Typography.Paragraph type="secondary">
        先提供基础权限清单和模块划分，后续可以继续接角色分配、按钮级控制和接口鉴权。
      </Typography.Paragraph>

      <Row gutter={[16, 16]}>
        {permissionGroups.map((group) => {
          const Icon = iconMap[group.key as keyof typeof iconMap] || LockOutlined;

          return (
            <Col xs={24} md={12} key={group.key}>
              <Card>
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                  <Space>
                    <Icon />
                    <Typography.Text strong>{group.name}</Typography.Text>
                  </Space>
                  <Space wrap>
                    {group.permissions.map((permission) => (
                      <Tag key={permission.id} color="processing">
                        {permission.code}
                      </Tag>
                    ))}
                  </Space>
                </Space>
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
}
