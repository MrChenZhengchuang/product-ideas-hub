import { useEffect, useMemo, useState } from 'react';
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
  Tag,
  Tooltip,
  TreeSelect,
  message
} from 'antd';
import { PermissionGuard } from '../components/PermissionGuard';
import { StatusSwitch } from '../components/StatusSwitch';
import {
  createSystemUser,
  fetchDepartments,
  deleteSystemUser,
  fetchRoles,
  fetchSystemUsers,
  type CurrentAdmin,
  type DepartmentItem,
  type RoleItem,
  type SystemUser,
  updateSystemUser,
  updateSystemUserStatus
} from '../api';

type SystemUsersPageProps = {
  currentAdmin: CurrentAdmin;
};

type UserFormValues = {
  name: string;
  account: string;
  password?: string;
  departmentId: number;
  roleIds: number[];
  status: string;
};

type DepartmentTreeOption = {
  title: string;
  value: number;
  key: number;
  children: DepartmentTreeOption[];
};

function buildDepartmentTreeOptions(items: DepartmentItem[]): DepartmentTreeOption[] {
  return items.map((item) => ({
    title: item.name,
    value: item.id,
    key: item.id,
    children: buildDepartmentTreeOptions(item.children || [])
  }));
}

export function SystemUsersPage({ currentAdmin }: SystemUsersPageProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SystemUser | null>(null);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<string>();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [form] = Form.useForm<UserFormValues>();

  const roleOptions = useMemo(
    () => roles.map((role) => ({ label: role.name, value: role.id })),
    [roles]
  );
  const canEditSystemUser = currentAdmin.permissions.includes('system_user.edit');

  const departmentOptions = useMemo(() => buildDepartmentTreeOptions(departments), [departments]);

  const loadData = async (page = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true);
    try {
      const [usersResult, roleRowsResult, departmentRows] = await Promise.all([
        fetchSystemUsers({ keyword, status, page, pageSize }),
        fetchRoles({ page: 1, pageSize: 200 }),
        fetchDepartments()
      ]);
      setSystemUsers(usersResult.list);
      setPagination({
        current: usersResult.page,
        pageSize: usersResult.pageSize,
        total: usersResult.total
      });
      setRoles(roleRowsResult.list);
      setDepartments(departmentRows);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '系统用户加载失败');
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
      name: '',
      account: '',
      password: '',
      departmentId: undefined,
      roleIds: roles[0] ? [roles[0].id] : [],
      status: '启用'
    });
    setModalOpen(true);
  };

  const openEditModal = (item: SystemUser) => {
    setEditingItem(item);
    form.setFieldsValue({
      name: item.name,
      account: item.account,
      password: '',
      departmentId: item.departmentId ?? undefined,
      roleIds: item.roleIds,
      status: item.status
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();

    try {
      if (editingItem) {
        await updateSystemUser(editingItem.id, values);
        messageApi.success('系统用户更新成功');
      } else {
        await createSystemUser({
          name: values.name,
          account: values.account,
          password: values.password || '',
          departmentId: values.departmentId,
          roleIds: values.roleIds,
          status: values.status
        });
        messageApi.success('系统用户创建成功');
      }

      setModalOpen(false);
      await loadData();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '系统用户保存失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteSystemUser(id);
      messageApi.success('系统用户已删除');
      await loadData();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '系统用户删除失败');
    }
  };

  const handleToggleStatus = async (item: SystemUser, checked: boolean) => {
    const nextStatus = checked ? '启用' : '停用';

    try {
      await updateSystemUserStatus(item.id, nextStatus);
      messageApi.success('账号状态已更新');
      await loadData();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '账号状态更新失败');
    }
  };

  return (
    <Card>
      {contextHolder}
      <Space className="filter-bar" wrap>
        <Input.Search
          allowClear
          placeholder="搜索姓名或账号"
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
            { label: '启用', value: '启用' },
            { label: '停用', value: '停用' }
          ]}
          onChange={(value) => setStatus(value)}
        />
        <PermissionGuard code="system_user.create" permissions={currentAdmin.permissions}>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            新建用户
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
        dataSource={systemUsers}
        scroll={{ x: 'max-content' }}
        columns={[
          { title: '姓名', dataIndex: 'name' },
          { title: '账号', dataIndex: 'account' },
          { title: '所属部门', dataIndex: 'departmentName', render: (value: string | null) => value || '-' },
          {
            title: '角色',
            dataIndex: 'roles',
            render: (value: string[]) => value.map((role) => <Tag key={role}>{role}</Tag>)
          },
          {
            title: '状态',
            dataIndex: 'status',
            render: (value: string, item) => (
              <StatusSwitch
                checked={value === '启用'}
                checkedLabel="启用"
                uncheckedLabel="停用"
                disabled={!canEditSystemUser}
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
                <PermissionGuard code="system_user.edit" permissions={currentAdmin.permissions}>
                  <Tooltip title="编辑">
                    <Button className="table-action-button" type="link" icon={<EditOutlined />} onClick={() => openEditModal(item)} />
                  </Tooltip>
                </PermissionGuard>
                <PermissionGuard code="system_user.delete" permissions={currentAdmin.permissions}>
                  <Popconfirm title="确认删除这个系统用户吗？" onConfirm={() => handleDelete(item.id)}>
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
        title={editingItem ? '编辑系统用户' : '新建系统用户'}
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
              <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="account" label="账号" rules={[{ required: true, message: '请输入账号' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="password"
                label={editingItem ? '重置密码' : '密码'}
                rules={editingItem ? [] : [{ required: true, message: '请输入密码' }]}
              >
                <Input.Password placeholder={editingItem ? '留空则不修改密码' : '请输入密码'} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="departmentId" label="所属部门" rules={[{ required: true, message: '请选择所属部门' }]}>
                <TreeSelect
                  treeData={departmentOptions}
                  placeholder="请选择所属部门"
                  treeDefaultExpandAll
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="状态"
                rules={[{ required: true, message: '请选择状态' }]}
                valuePropName="checked"
                getValueProps={(value: UserFormValues['status']) => ({ checked: value === '启用' })}
                getValueFromEvent={(checked: boolean) => (checked ? '启用' : '停用')}
              >
                <StatusSwitch checked={true} checkedLabel="启用" uncheckedLabel="停用" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="roleIds" label="角色" rules={[{ required: true, message: '请选择角色' }]}>
                <Select mode="multiple" options={roleOptions} placeholder="请选择一个或多个角色" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </Card>
  );
}
