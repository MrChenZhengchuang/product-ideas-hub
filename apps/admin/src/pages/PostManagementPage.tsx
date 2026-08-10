import { useMemo, useState } from 'react';
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
  Tooltip,
  message
} from 'antd';
import { PermissionGuard } from '../components/PermissionGuard';
import { StatusSwitch } from '../components/StatusSwitch';
import type { CurrentAdmin } from '../api';

type PostManagementPageProps = {
  currentAdmin: CurrentAdmin;
};

type PostRecord = {
  id: number;
  name: string;
  code: string;
  level: string;
  status: '启用' | '停用';
  sortOrder: number;
  remark: string;
};

type PostFormValues = Omit<PostRecord, 'id'>;

const initialPosts: PostRecord[] = [
  { id: 1, name: '产品总监', code: 'product_director', level: 'P8', status: '启用', sortOrder: 1, remark: '负责产品规划与业务决策' },
  { id: 2, name: '前端工程师', code: 'frontend_engineer', level: 'P5', status: '启用', sortOrder: 2, remark: '负责 Web 管理端与客户端交付' },
  { id: 3, name: '运营专员', code: 'ops_specialist', level: 'P4', status: '启用', sortOrder: 3, remark: '负责内容发布和活动运营' }
];

export function PostManagementPage({ currentAdmin }: PostManagementPageProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [posts, setPosts] = useState<PostRecord[]>(initialPosts);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<string>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PostRecord | null>(null);
  const [form] = Form.useForm<PostFormValues>();

  const filteredData = useMemo(
    () =>
      posts.filter((item) => {
        const matchKeyword = !keyword || item.name.includes(keyword) || item.code.includes(keyword);
        const matchStatus = !status || item.status === status;
        return matchKeyword && matchStatus;
      }),
    [posts, keyword, status]
  );

  const openCreateModal = () => {
    setEditingItem(null);
    form.setFieldsValue({
      name: '',
      code: '',
      level: 'P4',
      status: '启用',
      sortOrder: posts.length + 1,
      remark: ''
    });
    setModalOpen(true);
  };

  const openEditModal = (item: PostRecord) => {
    setEditingItem(item);
    form.setFieldsValue(item);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();

    if (editingItem) {
      setPosts((prev) => prev.map((item) => (item.id === editingItem.id ? { ...item, ...values } : item)));
      messageApi.success('岗位信息已更新');
    } else {
      setPosts((prev) => [...prev, { id: Date.now(), ...values }]);
      messageApi.success('岗位创建成功');
    }

    setModalOpen(false);
  };

  const handleDelete = (id: number) => {
    setPosts((prev) => prev.filter((item) => item.id !== id));
    messageApi.success('岗位已删除');
  };

  return (
    <Card>
      {contextHolder}
      <Space className="filter-bar" wrap>
        <Input.Search
          allowClear
          placeholder="搜索岗位名称或编码"
          style={{ width: 260 }}
          onSearch={(value) => setKeyword(value)}
        />
        <Select
          allowClear
          placeholder="筛选状态"
          style={{ width: 160 }}
          options={[{ label: '启用', value: '启用' }, { label: '停用', value: '停用' }]}
          onChange={(value) => setStatus(value)}
        />
        <PermissionGuard code="post.create" permissions={currentAdmin.permissions}>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            新增岗位
          </Button>
        </PermissionGuard>
      </Space>

      <Table
        rowKey="id"
        pagination={{ defaultPageSize: 10, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'] }}
        dataSource={filteredData}
        scroll={{ x: 'max-content' }}
        columns={[
          { title: '岗位名称', dataIndex: 'name' },
          { title: '岗位编码', dataIndex: 'code' },
          { title: '职级', dataIndex: 'level', width: 90 },
          { title: '排序', dataIndex: 'sortOrder', width: 90 },
          {
            title: '状态',
            dataIndex: 'status',
            width: 90,
            render: (value: string) => (
              <StatusSwitch checked={value === '启用'} checkedLabel="启用" uncheckedLabel="停用" disabled size="small" />
            )
          },
          { title: '备注', dataIndex: 'remark' },
          {
            title: '操作',
            key: 'action',
            fixed: 'right',
            width: 92,
            render: (_, item) => (
              <Space size={0} className="table-actions">
                <PermissionGuard code="post.edit" permissions={currentAdmin.permissions}>
                  <Tooltip title="编辑">
                    <Button className="table-action-button" type="link" icon={<EditOutlined />} onClick={() => openEditModal(item)} />
                  </Tooltip>
                </PermissionGuard>
                <PermissionGuard code="post.delete" permissions={currentAdmin.permissions}>
                  <Popconfirm title="确认删除这个岗位吗？" onConfirm={() => handleDelete(item.id)}>
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
        title={editingItem ? '编辑岗位' : '新增岗位'}
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
              <Form.Item name="name" label="岗位名称" rules={[{ required: true, message: '请输入岗位名称' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="code" label="岗位编码" rules={[{ required: true, message: '请输入岗位编码' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="level" label="职级">
                <Select options={['P4', 'P5', 'P6', 'P7', 'P8'].map((item) => ({ label: item, value: item }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="状态"
                valuePropName="checked"
                getValueProps={(value: PostFormValues['status']) => ({ checked: value === '启用' })}
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
            <Col span={24}>
              <Form.Item name="remark" label="备注">
                <Input.TextArea rows={4} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </Card>
  );
}
