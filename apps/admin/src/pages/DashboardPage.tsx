import { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Typography } from 'antd';
import { fetchDashboardStats, type DashboardStats } from '../api';

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    systemUsers: 0,
    roles: 0,
    siteUsers: 0,
    projects: 0
  });

  useEffect(() => {
    fetchDashboardStats().then(setStats);
  }, []);

  return (
    <div>
      <Typography.Title level={3}>系统概览</Typography.Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} xl={6}>
          <Card>
            <Statistic title="系统用户" value={stats.systemUsers} suffix="人" />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card>
            <Statistic title="角色数" value={stats.roles} suffix="个" />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card>
            <Statistic title="网站用户" value={stats.siteUsers} suffix="人" />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card>
            <Statistic title="项目数" value={stats.projects} suffix="个" />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
