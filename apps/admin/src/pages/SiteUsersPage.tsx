import { useEffect, useState } from 'react';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Tooltip,
  message
} from 'antd';
import { PermissionGuard } from '../components/PermissionGuard';
import { StatusSwitch } from '../components/StatusSwitch';
import {
  createSiteUser,
  deleteSiteUser,
  fetchSiteUsers,
  type CurrentAdmin,
  type SiteUser,
  updateSiteUser,
  updateSiteUserStatus
} from '../api';

type SiteUsersPageProps = {
  currentAdmin: CurrentAdmin;
};

type SiteUserFormValues = {
  nickname: string;
  phone: string;
  level: string;
  status: '正常' | '冻结';
};

export function SiteUsersPage({ currentAdmin }: SiteUsersPageProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [siteUsers, setSiteUsers] = useState<SiteUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<string>();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SiteUser | null>(null);
  const [form] = Form.useForm<SiteUserFormValues>();
  const canFreezeSiteUser = currentAdmin.permissions.includes('site_user.freeze');

  const loadData = async (page = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true);
    try {
      const result = await fetchSiteUsers({ keyword, status, page, pageSize });
      setSiteUsers(result.list);
      setPagination({
        current: result.page,
        pageSize: result.pageSize,
        total: result.total
      });
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '网站用户加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPagination((prev) => ({ ...prev, current: 1 }));
    loadData(1, pagination.pageSize);
  }, [keyword, status]);

  const openCreateModal = () => {
    setEditingItem(null);
    form.setFieldsValue({
      nickname: '',
      phone: '',
      level: '普通会员',
      status: '正常'
    });
    setModalOpen(true);
  };

  const openEditModal = (item: SiteUser) => {
    setEditingItem(item);
    form.setFieldsValue(item);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();

    try {
      if (editingItem) {
        await updateSiteUser(editingItem.id, values);
        messageApi.success('网站用户更新成功');
      } else {
        await createSiteUser(values);
        messageApi.success('网站用户创建成功');
      }

      setModalOpen(false);
      await loadData();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '网站用户保存失败');
    }
  };

  const handleToggleStatus = async (item: SiteUser, checked: boolean) => {
    const nextStatus = checked ? '正常' : '冻结';

    try {
      await updateSiteUserStatus(item.id, nextStatus);
      messageApi.success('网站用户状态已更新');
      await loadData();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '网站用户状态更新失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteSiteUser(id);
      messageApi.success('网站用户已删除');
      await loadData();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '网站用户删除失败');
    }
  };

  return (
    <Card>
      {contextHolder}
      <Space className="filter-bar" wrap>
        <Input.Search
          allowClear
          placeholder="搜索昵称或手机号"
          style={{ width: 240 }}
          onSearch={(value) => {
            setKeyword(value);
          }}
        />
        <Select
          allowClear
          placeholder="筛选状态"
          style={{ width: 160 }}
          options={[
            { label: '正常', value: '正常' },
            { label: '冻结', value: '冻结' }
          ]}
          onChange={(value) => setStatus(value)}
        />
        <PermissionGuard code="site_user.tag" permissions={currentAdmin.permissions}>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            新建网站用户
          </Button>
        </PermissionGuard>
      </Space>

      <Table
        rowKey="id"
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
          onChange: (page, pageSize) => {
            loadData(page, pageSize);
          }
        }}
        dataSource={siteUsers}
        scroll={{ x: 'max-content' }}
        columns={[
          { title: '昵称', dataIndex: 'nickname' },
          { title: '手机号', dataIndex: 'phone' },
          { title: '会员等级', dataIndex: 'level' },
          {
            title: '状态',
            dataIndex: 'status',
            render: (value: string, item) => (
              <StatusSwitch
                checked={value === '正常'}
                checkedLabel="正常"
                uncheckedLabel="冻结"
                disabled={!canFreezeSiteUser}
                size="small"
                onChange={(checked) => handleToggleStatus(item, checked)}
              />
            )
          },
          {
            title: '操作',
            key: 'action',
            fixed: 'right',
            width: 132,
            render: (_, item) => (
              <Space size={0} className="table-actions">
                <PermissionGuard code="site_user.tag" permissions={currentAdmin.permissions}>
                  <Tooltip title="编辑">
                    <Button className="table-action-button" type="link" icon={<EditOutlined />} onClick={() => openEditModal(item)} />
                  </Tooltip>
                </PermissionGuard>
                <PermissionGuard code="site_user.tag" permissions={currentAdmin.permissions}>
                  <Popconfirm title="确认删除这个网站用户吗？" onConfirm={() => handleDelete(item.id)}>
                    <Tooltip title="删除">
                      <Button danger className="table-action-button" type="link" icon={<DeleteOutlined />} />
                    </Tooltip>
                  </Popconfirm>
                </PermissionGuard>
              </Space>
            )
          }
        ]}
      />

      <Modal
        className="admin-modal"
        title={editingItem ? '编辑网站用户' : '新建网站用户'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={760}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="horizontal"
          labelCol={{ flex: '88px' }}
          wrapperCol={{ flex: 'auto' }}
          labelAlign="right"
          colon
          className="admin-modal-form"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="nickname" label="昵称" rules={[{ required: true, message: '请输入昵称' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="手机号" rules={[{ required: true, message: '请输入手机号' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="level" label="会员等级" rules={[{ required: true, message: '请选择会员等级' }]}>
                <Select
                  options={[
                    { label: '普通会员', value: '普通会员' },
                    { label: '黄金会员', value: '黄金会员' },
                    { label: '白金会员', value: '白金会员' }
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="状态"
                rules={[{ required: true, message: '请选择状态' }]}
                valuePropName="checked"
                getValueProps={(value: SiteUserFormValues['status']) => ({ checked: value === '正常' })}
                getValueFromEvent={(checked: boolean) => (checked ? '正常' : '冻结')}
              >
                <StatusSwitch checkedLabel="正常" uncheckedLabel="冻结" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </Card>
  );
}
