import { useEffect, useMemo, useState } from 'react';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
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
  createDepartment,
  deleteDepartment,
  fetchDepartments,
  fetchDepartmentUserOptions,
  type CurrentAdmin,
  type DepartmentItem,
  type DepartmentUserOption,
  updateDepartment
} from '../api';

type DepartmentManagementPageProps = {
  currentAdmin: CurrentAdmin;
};

type DepartmentLeaderFormItem = {
  adminUserId?: number;
  phone: string;
  email: string;
};

type DepartmentFormValues = {
  parentId: number | null;
  name: string;
  leaders: DepartmentLeaderFormItem[];
  status: '启用' | '停用';
  sortOrder: number;
};

type TreeOption = {
  title: string;
  value: number;
  key: number;
  children: TreeOption[];
};

type DepartmentTreeRow = Omit<DepartmentItem, 'children'> & {
  level: number;
  children?: DepartmentTreeRow[];
};

function withLevel(items: DepartmentItem[], level = 0): DepartmentTreeRow[] {
  return items.map((item) => ({
    ...item,
    level,
    children: item.children?.length ? withLevel(item.children, level + 1) : undefined
  }));
}

function flattenDepartments(items: DepartmentItem[]): DepartmentItem[] {
  return items.flatMap((item) => [item, ...(item.children ? flattenDepartments(item.children) : [])]);
}

function buildTreeSelectData(items: DepartmentItem[], currentId?: number): TreeOption[] {
  return items
    .filter((item) => item.id !== currentId)
    .map((item) => ({
      title: item.name,
      value: item.id,
      key: item.id,
      children: buildTreeSelectData(item.children || [], currentId)
    }));
}

export function DepartmentManagementPage({ currentAdmin }: DepartmentManagementPageProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [userOptions, setUserOptions] = useState<DepartmentUserOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DepartmentItem | null>(null);
  const [createParentId, setCreateParentId] = useState<number | null>(null);
  const [form] = Form.useForm<DepartmentFormValues>();

  const loadDepartments = async (nextKeyword = keyword) => {
    setLoading(true);
    try {
      const [rows, users] = await Promise.all([fetchDepartments({ keyword: nextKeyword }), fetchDepartmentUserOptions()]);
      setDepartments(rows);
      setUserOptions(users);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '部门列表加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const departmentOptions = useMemo(
    () => [
      { title: '顶级部门', value: 0, key: 0 },
      ...buildTreeSelectData(departments, editingItem?.id)
    ],
    [departments, editingItem]
  );

  const userSelectOptions = useMemo(
    () =>
      userOptions.map((item) => ({
        label: item.name,
        value: item.id
      })),
    [userOptions]
  );

  const getSelectedLeaderIds = (currentIndex: number) => {
    const leaders = (form.getFieldValue('leaders') || []) as DepartmentLeaderFormItem[];
    return leaders
      .map((item, index) => (index === currentIndex ? undefined : item?.adminUserId))
      .filter((value): value is number => typeof value === 'number');
  };

  const tableData = useMemo(() => withLevel(departments), [departments]);

  const openCreateModal = () => {
    setEditingItem(null);
    setCreateParentId(null);
    form.setFieldsValue({
      parentId: 0,
      name: '',
      leaders: [{ adminUserId: undefined, phone: '', email: '' }],
      status: '启用',
      sortOrder: flattenDepartments(departments).length + 1
    });
    setModalOpen(true);
  };

  const openCreateChildModal = (parent: DepartmentTreeRow) => {
    setEditingItem(null);
    setCreateParentId(parent.id);
    form.setFieldsValue({
      parentId: parent.id,
      name: '',
      leaders: [{ adminUserId: undefined, phone: '', email: '' }],
      status: '启用',
      sortOrder: (parent.children?.length ?? 0) + 1
    });
    setModalOpen(true);
  };

  const openEditModal = (item: DepartmentItem) => {
    setEditingItem(item);
    setCreateParentId(null);
    form.setFieldsValue({
      parentId: item.parentId ?? 0,
      name: item.name,
      leaders: item.leaders.length
        ? item.leaders.map((leader) => ({
            adminUserId: leader.adminUserId,
            phone: leader.phone,
            email: leader.email
          }))
        : [{ adminUserId: undefined, phone: item.phone || '', email: item.email || '' }],
      status: item.status,
      sortOrder: item.sortOrder
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const payload = {
      parentId: values.parentId && values.parentId > 0 ? values.parentId : null,
      name: values.name,
      leaders: values.leaders.map((leader) => ({
        adminUserId: Number(leader.adminUserId),
        phone: leader.phone.trim(),
        email: leader.email.trim()
      })),
      status: values.status,
      sortOrder: values.sortOrder
    };

    try {
      if (editingItem) {
        await updateDepartment(editingItem.id, payload);
        messageApi.success('部门更新成功');
      } else {
        await createDepartment(payload);
        messageApi.success('部门创建成功');
      }

      setModalOpen(false);
      await loadDepartments();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '部门保存失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteDepartment(id);
      messageApi.success('部门已删除');
      await loadDepartments();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '部门删除失败');
    }
  };

  return (
    <Card>
      {contextHolder}
      <Space className="filter-bar" wrap>
        <Input.Search
          allowClear
          placeholder="搜索部门名称、负责人、电话或邮箱"
          style={{ width: 300 }}
          onSearch={(value) => {
            setKeyword(value);
            loadDepartments(value);
          }}
        />
        <PermissionGuard code="department.create" permissions={currentAdmin.permissions}>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            新增部门
          </Button>
        </PermissionGuard>
      </Space>

      <Table
        rowKey="id"
        loading={loading}
        pagination={false}
        defaultExpandAllRows
        indentSize={24}
        dataSource={tableData}
        scroll={{ x: 'max-content' }}
        columns={[
          { title: '部门名称', dataIndex: 'name' },
          {
            title: '负责人',
            dataIndex: 'leaders',
            width: 260,
            render: (value: DepartmentItem['leaders']) =>
              value?.length
                ? value.map((leader) => (
                    <Tag key={`${leader.adminUserId}-${leader.email}`} color={leader.isPrimary ? 'processing' : 'default'}>
                      {leader.name}
                      {leader.isPrimary ? '（主）' : ''}
                    </Tag>
                  ))
                : '-'
          },
          { title: '主要联系电话', dataIndex: 'phone', width: 150 },
          { title: '主要邮箱', dataIndex: 'email', width: 220 },
          { title: '排序', dataIndex: 'sortOrder', width: 90 },
          {
            title: '状态',
            dataIndex: 'status',
            width: 90,
            render: (value: string) => (
              <StatusSwitch checked={value === '启用'} checkedLabel="启用" uncheckedLabel="停用" disabled size="small" />
            )
          },
          {
            title: '操作',
            key: 'action',
            fixed: 'right',
            width: 132,
            render: (_, item: DepartmentTreeRow) => (
              <Space size={0} className="table-actions">
                {item.level <= 1 ? (
                  <PermissionGuard code="department.create" permissions={currentAdmin.permissions}>
                    <Tooltip title="添加子部门">
                      <Button
                        className="table-action-button"
                        type="link"
                        icon={<PlusOutlined />}
                        onClick={() => openCreateChildModal(item)}
                      />
                    </Tooltip>
                  </PermissionGuard>
                ) : null}
                <PermissionGuard code="department.edit" permissions={currentAdmin.permissions}>
                  <Tooltip title="编辑">
                    <Button className="table-action-button" type="link" icon={<EditOutlined />} onClick={() => openEditModal(item)} />
                  </Tooltip>
                </PermissionGuard>
                <PermissionGuard code="department.delete" permissions={currentAdmin.permissions}>
                  <Popconfirm title="确认删除这个部门吗？" onConfirm={() => handleDelete(item.id)}>
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
        title={editingItem ? '编辑部门' : createParentId ? '新增子部门' : '新增部门'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={980}
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
              <Form.Item name="parentId" label="上级部门">
                <TreeSelect treeData={departmentOptions} placeholder="请选择上级部门" treeDefaultExpandAll allowClear />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="name" label="部门名称" rules={[{ required: true, message: '请输入部门名称' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="状态"
                rules={[{ required: true, message: '请选择状态' }]}
                valuePropName="checked"
                getValueProps={(value: DepartmentFormValues['status']) => ({ checked: value === '启用' })}
                getValueFromEvent={(checked: boolean) => (checked ? '启用' : '停用')}
              >
                <StatusSwitch checkedLabel="启用" uncheckedLabel="停用" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="sortOrder" label="显示排序">
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.List name="leaders">
            {(fields, { add, remove }) => (
              <div style={{ marginTop: 8 }}>
                {fields.length === 0 ? (
                  <div style={{ marginBottom: 16 }}>
                    <Button
                      type="dashed"
                      icon={<PlusOutlined />}
                      onClick={() => add({ adminUserId: undefined, phone: '', email: '' })}
                    >
                      添加负责人
                    </Button>
                  </div>
                ) : null}
                {fields.map((field, index) => (
                  <div
                    key={field.key}
                    style={{
                      marginBottom: 16,
                      padding: 16,
                      border: '1px solid #e5e7eb',
                      borderRadius: 8
                    }}
                  >
                    <Space style={{ marginBottom: 12, width: '100%', justifyContent: 'space-between' }}>
                      <Space>
                        <Tag color={index === 0 ? 'processing' : 'default'}>{index === 0 ? '主要负责人' : `负责人 ${index + 1}`}</Tag>
                      </Space>
                      <Space>
                        {index === fields.length - 1 ? (
                          <Button
                            type="dashed"
                            icon={<PlusOutlined />}
                            onClick={() => add({ adminUserId: undefined, phone: '', email: '' })}
                          >
                            添加负责人
                          </Button>
                        ) : null}
                        {index > 0 ? (
                          <Button danger type="text" icon={<DeleteOutlined />} onClick={() => remove(field.name)}>
                            删除
                          </Button>
                        ) : null}
                      </Space>
                    </Space>

                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item
                          {...field}
                          name={[field.name, 'adminUserId']}
                          label={index === 0 ? '负责人' : '负责人'}
                          rules={[
                            { required: true, message: '请选择负责人' },
                            {
                              validator: (_, value) => {
                                if (!value) {
                                  return Promise.resolve();
                                }

                                const duplicated = getSelectedLeaderIds(index).includes(value);
                                return duplicated ? Promise.reject(new Error('同一个部门不能重复添加同一负责人')) : Promise.resolve();
                              }
                            }
                          ]}
                        >
                          <Select
                            showSearch
                            optionFilterProp="label"
                            placeholder="请选择负责人"
                            options={userSelectOptions.map((option) => ({
                              ...option,
                              disabled: getSelectedLeaderIds(index).includes(option.value)
                            }))}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          {...field}
                          name={[field.name, 'phone']}
                          label="联系电话"
                          rules={[{ required: true, message: '请输入联系电话' }]}
                        >
                          <Input placeholder="请输入联系电话" />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          {...field}
                          name={[field.name, 'email']}
                          label="邮箱"
                          rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '请输入正确的邮箱' }]}
                        >
                          <Input placeholder="请输入邮箱" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                ))}
              </div>
            )}
          </Form.List>
        </Form>
      </Modal>
    </Card>
  );
}
