import { useEffect, useState, type Key } from 'react';
import { DeleteOutlined, EditOutlined, PlusOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Table,
  Tag,
  Tree,
  Tooltip,
  message
} from 'antd';
import { PermissionGuard } from '../components/PermissionGuard';
import { StatusSwitch } from '../components/StatusSwitch';
import {
  createRole,
  deleteRole,
  fetchAuthorizationTree,
  fetchRoleDetail,
  fetchRoles,
  type AuthorizationTreeNode,
  type CurrentAdmin,
  type RoleItem,
  updateRole,
  updateRoleMenus,
  updateRolePermissions,
  updateRoleStatus
} from '../api';

type RolesPageProps = {
  currentAdmin: CurrentAdmin;
};

type RoleFormValues = {
  name: string;
  scope: string;
  status: '启用' | '停用';
};

export function RolesPage({ currentAdmin }: RolesPageProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [authorizationTree, setAuthorizationTree] = useState<AuthorizationTreeNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [authorizationModalOpen, setAuthorizationModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null);
  const [assigningRole, setAssigningRole] = useState<RoleItem | null>(null);
  const [checkedAuthKeys, setCheckedAuthKeys] = useState<Key[]>([]);
  const [authKeyword, setAuthKeyword] = useState('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [form] = Form.useForm<RoleFormValues>();
  const canEditRole = currentAdmin.permissions.includes('role.edit');

  const defaultExpandedKeys = authorizationTree.map((node) => node.key);
  const selectedMenuCount = checkedAuthKeys.filter((item) => String(item).startsWith('menu-')).length;
  const selectedPermissionCount = checkedAuthKeys.filter((item) => String(item).startsWith('permission-')).length;
  const allAuthorizationKeys = authorizationTree.flatMap(function collectKeys(node): string[] {
    return [String(node.key), ...node.children.flatMap(collectKeys)];
  });

  const filterAuthorizationTree = (nodes: AuthorizationTreeNode[]): AuthorizationTreeNode[] => {
    const keyword = authKeyword.trim().toLowerCase();

    if (!keyword) {
      return nodes;
    }

    return nodes
      .map((node) => {
        const children = filterAuthorizationTree(node.children || []);
        const matched =
          node.title.toLowerCase().includes(keyword) || `${node.permissionCode || ''}`.toLowerCase().includes(keyword);

        if (matched || children.length) {
          return {
            ...node,
            children
          };
        }

        return null;
      })
      .filter((item): item is AuthorizationTreeNode => Boolean(item));
  };

  const filteredAuthorizationTree = filterAuthorizationTree(authorizationTree);

  const loadData = async (page = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true);
    try {
      const [roleRowsResult, authTreeRows] = await Promise.all([
        fetchRoles({ page, pageSize }),
        fetchAuthorizationTree()
      ]);
      setRoles(roleRowsResult.list);
      setPagination({
        current: roleRowsResult.page,
        pageSize: roleRowsResult.pageSize,
        total: roleRowsResult.total
      });
      setAuthorizationTree(authTreeRows);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '角色数据加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingRole(null);
    form.setFieldsValue({ name: '', scope: '', status: '启用' });
    setRoleModalOpen(true);
  };

  const openEditModal = (role: RoleItem) => {
    setEditingRole(role);
    form.setFieldsValue({ name: role.name, scope: role.scope, status: role.status });
    setRoleModalOpen(true);
  };

  const openAuthorizationModal = async (role: RoleItem) => {
    try {
      const detail = await fetchRoleDetail(role.id);
      setAssigningRole(role);
      setAuthKeyword('');
      setCheckedAuthKeys([
        ...detail.menuIds.map((id) => `menu-${id}`),
        ...detail.permissionIds.map((id) => `permission-${id}`)
      ]);
      setAuthorizationModalOpen(true);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '角色授权加载失败');
    }
  };

  const handleRoleSubmit = async () => {
    const values = await form.validateFields();

    try {
      if (editingRole) {
        await updateRole(editingRole.id, values);
        messageApi.success('角色更新成功');
      } else {
        await createRole(values);
        messageApi.success('角色创建成功');
      }

      setRoleModalOpen(false);
      await loadData();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '角色保存失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteRole(id);
      messageApi.success('角色已删除');
      await loadData();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '角色删除失败');
    }
  };

  const handleToggleStatus = async (role: RoleItem, checked: boolean) => {
    const nextStatus = checked ? '启用' : '停用';

    try {
      await updateRoleStatus(role.id, nextStatus);
      messageApi.success('角色状态已更新');
      await loadData();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '角色状态更新失败');
    }
  };

  const handleAuthorizationSubmit = async () => {
    if (!assigningRole) {
      return;
    }

    try {
      const checkedKeys = checkedAuthKeys.map((item) => String(item));
      const menuIds = checkedKeys
        .filter((key) => key.startsWith('menu-'))
        .map((key) => Number(key.replace('menu-', '')));
      const permissionIds = checkedKeys
        .filter((key) => key.startsWith('permission-'))
        .map((key) => Number(key.replace('permission-', '')));

      await Promise.all([
        updateRoleMenus(assigningRole.id, menuIds),
        updateRolePermissions(assigningRole.id, permissionIds)
      ]);
      messageApi.success('角色授权成功');
      setAuthorizationModalOpen(false);
      await loadData();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '角色授权失败');
    }
  };

  const renderAuthorizationTitle = (node: AuthorizationTreeNode) => (
    <span className="authorization-tree__title">
      <span>{node.title}</span>
      {node.nodeType === 'menu' ? <Tag color="blue">菜单</Tag> : null}
      {node.nodeType === 'group' ? <Tag>分组</Tag> : null}
      {node.nodeType === 'permission' ? (
        <>
          <Tag color="orange">按钮</Tag>
          {node.permissionCode ? <span className="authorization-tree__code">{node.permissionCode}</span> : null}
        </>
      ) : null}
    </span>
  );

  return (
    <Card>
      {contextHolder}
      <Space className="filter-bar" wrap>
        <PermissionGuard code="role.create" permissions={currentAdmin.permissions}>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            新建角色
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
        dataSource={roles}
        scroll={{ x: 'max-content' }}
        columns={[
          { title: '角色名称', dataIndex: 'name' },
          {
            title: '成员数',
            dataIndex: 'members',
            render: (value: number) => <Tag color="blue">{value} 人</Tag>
          },
          { title: '权限范围', dataIndex: 'scope' },
          {
            title: '启用',
            dataIndex: 'status',
            render: (value: RoleItem['status'], role) => (
              <StatusSwitch
                checked={value === '启用'}
                checkedLabel="启用"
                uncheckedLabel="停用"
                disabled={!canEditRole}
                size="small"
                onChange={(checked) => handleToggleStatus(role, checked)}
              />
            )
          },
          {
            title: '操作',
            key: 'action',
            fixed: 'right',
            width: 132,
            render: (_, role) => (
              <Space size={0} className="table-actions">
                <PermissionGuard code="role.edit" permissions={currentAdmin.permissions}>
                  <Tooltip title="编辑">
                    <Button className="table-action-button" type="link" icon={<EditOutlined />} onClick={() => openEditModal(role)} />
                  </Tooltip>
                </PermissionGuard>
                <PermissionGuard code="role.assign" permissions={currentAdmin.permissions}>
                  <Tooltip title="角色授权">
                    <Button
                      className="table-action-button"
                      type="link"
                      icon={<SafetyCertificateOutlined />}
                      onClick={() => openAuthorizationModal(role)}
                    />
                  </Tooltip>
                </PermissionGuard>
                <PermissionGuard code="role.delete" permissions={currentAdmin.permissions}>
                  <Popconfirm title="确认删除这个角色吗？" onConfirm={() => handleDelete(role.id)}>
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
        title={editingRole ? '编辑角色' : '新建角色'}
        open={roleModalOpen}
        onOk={handleRoleSubmit}
        onCancel={() => setRoleModalOpen(false)}
        width={760}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="horizontal"
          labelCol={{ flex: '100px' }}
          wrapperCol={{ flex: 'auto' }}
          labelAlign="right"
          colon
          className="admin-modal-form"
        >
          <Form.Item name="name" label="角色名称" rules={[{ required: true, message: '请输入角色名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="scope" label="权限范围说明" rules={[{ required: true, message: '请输入权限范围说明' }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="status"
            label="角色状态"
            valuePropName="checked"
            getValueProps={(value: RoleFormValues['status']) => ({ checked: value === '启用' })}
            getValueFromEvent={(checked: boolean) => (checked ? '启用' : '停用')}
          >
            <StatusSwitch checkedLabel="启用" uncheckedLabel="停用" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        className="admin-modal"
        title={assigningRole ? `角色授权 - ${assigningRole.name}` : '角色授权'}
        open={authorizationModalOpen}
        onOk={handleAuthorizationSubmit}
        onCancel={() => setAuthorizationModalOpen(false)}
        width={820}
        destroyOnHidden
      >
        <div className="authorization-panel">
          <div className="authorization-panel__toolbar">
            <Input.Search
              allowClear
              placeholder="搜索菜单、分组或权限字符"
              value={authKeyword}
              onChange={(event) => setAuthKeyword(event.target.value)}
            />
            <Space wrap>
              <Button size="small" onClick={() => setCheckedAuthKeys(Array.from(new Set(allAuthorizationKeys)))}>
                全选
              </Button>
              <Button size="small" onClick={() => setCheckedAuthKeys([])}>
                清空
              </Button>
            </Space>
          </div>
          <div className="authorization-panel__summary">
            <div className="authorization-panel__metric">
              <span className="authorization-panel__metric-label">已选菜单</span>
              <strong>{selectedMenuCount}</strong>
            </div>
            <div className="authorization-panel__metric">
              <span className="authorization-panel__metric-label">已选按钮权限</span>
              <strong>{selectedPermissionCount}</strong>
            </div>
            <div className="authorization-panel__metric">
              <span className="authorization-panel__metric-label">当前结果</span>
              <strong>{filteredAuthorizationTree.length}</strong>
            </div>
          </div>
          <Tree
            checkable
            defaultExpandedKeys={defaultExpandedKeys}
            checkedKeys={checkedAuthKeys}
            onCheck={(checked) => setCheckedAuthKeys((checked as Key[]) || [])}
            treeData={filteredAuthorizationTree.map(function decorate(node): Record<string, unknown> {
              return {
                ...node,
                title: renderAuthorizationTitle(node),
                children: node.children.map(decorate)
              };
            })}
            height={480}
          />
          {!filteredAuthorizationTree.length && authKeyword ? <div className="authorization-panel__empty">没有匹配的授权项</div> : null}
        </div>
      </Modal>
    </Card>
  );
}
