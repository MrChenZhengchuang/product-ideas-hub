import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Form,
  Image,
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
  Typography,
  message
} from 'antd';
import { PermissionGuard } from '../components/PermissionGuard';
import { StatusSwitch } from '../components/StatusSwitch';
import {
  createProject,
  deleteProject,
  fetchProjectCategories,
  fetchProjects,
  type CurrentAdmin,
  type ProjectCategoryOption,
  type ProjectItem,
  auditProject,
  updateProject,
  updateProjectStatus
} from '../api';

type ProjectsPageProps = {
  currentAdmin: CurrentAdmin;
};

type ProjectFormValues = {
  title: string;
  description: string;
  image: string;
  status: string;
  sortOrder: number;
  categoryId: number;
};

export function ProjectsPage({ currentAdmin }: ProjectsPageProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [categories, setCategories] = useState<ProjectCategoryOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProjectItem | null>(null);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<string>();
  const [auditStatus, setAuditStatus] = useState<string>();
  const [category, setCategory] = useState<string>();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [auditAction, setAuditAction] = useState<'approve' | 'reject'>('approve');
  const [auditingItem, setAuditingItem] = useState<ProjectItem | null>(null);
  const [form] = Form.useForm<ProjectFormValues>();
  const [auditForm] = Form.useForm<{ comment: string }>();

  const categoryOptions = useMemo(
    () => categories.map((item) => ({ label: item.label, value: item.id })),
    [categories]
  );
  const canPublishProject = currentAdmin.permissions.includes('project.publish');

  const loadProjects = async (page = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true);
    try {
      const [projectRowsResult, categoryRows] = await Promise.all([
        fetchProjects({ keyword, status, category, auditStatus, page, pageSize }),
        fetchProjectCategories()
      ]);
      setProjects(projectRowsResult.list);
      setPagination({
        current: projectRowsResult.page,
        pageSize: projectRowsResult.pageSize,
        total: projectRowsResult.total
      });
      setCategories(categoryRows);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '项目数据加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPagination((prev) => ({ ...prev, current: 1 }));
    loadProjects(1, pagination.pageSize);
  }, [keyword, status, category, auditStatus]);

  const openCreateModal = () => {
    setEditingItem(null);
    form.setFieldsValue({
      title: '',
      description: '',
      image: '',
      status: 'draft',
      sortOrder: 0,
      categoryId: categories[0]?.id
    });
    setModalOpen(true);
  };

  const openEditModal = (item: ProjectItem) => {
    setEditingItem(item);
    form.setFieldsValue({
      title: item.title,
      description: item.description,
      image: item.image,
      status: item.status,
      sortOrder: item.sortOrder,
      categoryId: item.categoryId
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();

    try {
      if (editingItem) {
        await updateProject(editingItem.id, values);
        messageApi.success('项目更新成功');
      } else {
        await createProject(values);
        messageApi.success('项目创建成功');
      }

      setModalOpen(false);
      await loadProjects();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '项目保存失败');
    }
  };

  const handleToggleStatus = async (item: ProjectItem, checked: boolean) => {
    const nextStatus = checked ? 'published' : 'draft';

    try {
      await updateProjectStatus(item.id, nextStatus);
      messageApi.success('项目状态已更新');
      await loadProjects();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '项目状态更新失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteProject(id);
      messageApi.success('项目已删除');
      await loadProjects();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '项目删除失败');
    }
  };

  const openAuditModal = (item: ProjectItem, action: 'approve' | 'reject') => {
    setAuditingItem(item);
    setAuditAction(action);
    auditForm.setFieldsValue({
      comment: action === 'reject' ? item.auditComment || '' : ''
    });
    setAuditModalOpen(true);
  };

  const handleAuditSubmit = async () => {
    if (!auditingItem) {
      return;
    }

    const values = await auditForm.validateFields();

    try {
      await auditProject(auditingItem.id, {
        action: auditAction,
        comment: values.comment
      });
      messageApi.success(auditAction === 'approve' ? '项目已审核通过' : '项目已驳回');
      setAuditModalOpen(false);
      setAuditingItem(null);
      await loadProjects();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '项目审核失败');
    }
  };

  return (
    <Card>
      {contextHolder}
      <Space className="filter-bar" wrap>
        <Input.Search
          allowClear
          placeholder="搜索项目标题"
          style={{ width: 240 }}
          onSearch={(value) => {
            setKeyword(value);
          }}
        />
        <Select
          allowClear
          placeholder="筛选分类"
          style={{ width: 180 }}
          options={categories.map((item) => ({ label: item.label, value: item.key }))}
          onChange={(value) => setCategory(value)}
        />
        <Select
          allowClear
          placeholder="筛选状态"
          style={{ width: 160 }}
          options={[
            { label: '已发布', value: 'published' },
            { label: '草稿', value: 'draft' }
          ]}
          onChange={(value) => setStatus(value)}
        />
        <Select
          allowClear
          placeholder="审核状态"
          style={{ width: 180 }}
          options={[
            { label: '待审核', value: 'pending' },
            { label: '已通过', value: 'approved' },
            { label: '已驳回', value: 'rejected' }
          ]}
          onChange={(value) => setAuditStatus(value)}
        />
        <PermissionGuard code="project.create" permissions={currentAdmin.permissions}>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            新建项目
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
            loadProjects(page, pageSize);
          }
        }}
        dataSource={projects}
        scroll={{ x: 1120 }}
        columns={[
          {
            title: '封面',
            dataIndex: 'image',
            width: 100,
            render: (image: string) => <Image src={image} width={68} height={44} style={{ objectFit: 'cover' }} />
          },
          { title: '标题', dataIndex: 'title', width: 220 },
          { title: '分类', dataIndex: 'categoryLabel', width: 120 },
          {
            title: '作者',
            dataIndex: 'creatorName',
            width: 120,
            render: (value: string | null) => value || '后台创建'
          },
          {
            title: '简介',
            dataIndex: 'description',
            ellipsis: true
          },
          { title: '排序', dataIndex: 'sortOrder', width: 90 },
          {
            title: '状态',
            dataIndex: 'status',
            width: 110,
            render: (value: string, item) =>
              value === 'hidden' ? (
                <Tag color="red">已隐藏</Tag>
              ) : (
                <StatusSwitch
                  checked={value === 'published'}
                  checkedLabel="发布"
                  uncheckedLabel="草稿"
                  disabled={!canPublishProject}
                  size="small"
                  onChange={(checked) => handleToggleStatus(item, checked)}
                />
              )
          },
          {
            title: '审核',
            dataIndex: 'auditStatus',
            width: 110,
            render: (value: string) => (
              <Tag color={value === 'approved' ? 'green' : value === 'rejected' ? 'red' : 'processing'}>
                {value === 'approved' ? '已通过' : value === 'rejected' ? '已驳回' : '待审核'}
              </Tag>
            )
          },
          {
            title: '互动',
            key: 'metrics',
            width: 160,
            render: (_, item) => (
              <Typography.Text type="secondary">
                浏 {item.viewCount} / 藏 {item.favoriteCount} / 赞 {item.likeCount}
              </Typography.Text>
            )
          },
          {
            title: '操作',
            key: 'action',
            fixed: 'right',
            width: 184,
            render: (_, item) => (
              <Space size={0} className="table-actions">
                <PermissionGuard code="project.edit" permissions={currentAdmin.permissions}>
                  <Tooltip title="编辑">
                    <Button className="table-action-button" type="link" icon={<EditOutlined />} onClick={() => openEditModal(item)} />
                  </Tooltip>
                </PermissionGuard>
                <PermissionGuard code="project.audit" permissions={currentAdmin.permissions}>
                  <Tooltip title="审核通过">
                    <Button
                      className="table-action-button"
                      type="link"
                      icon={<CheckCircleOutlined />}
                      disabled={item.auditStatus === 'approved'}
                      onClick={() => openAuditModal(item, 'approve')}
                    />
                  </Tooltip>
                  <Tooltip title="驳回">
                    <Button
                      danger
                      className="table-action-button"
                      type="link"
                      icon={<CloseCircleOutlined />}
                      disabled={item.auditStatus === 'rejected'}
                      onClick={() => openAuditModal(item, 'reject')}
                    />
                  </Tooltip>
                </PermissionGuard>
                {item.auditComment ? (
                  <Tooltip title={item.auditComment}>
                    <Button className="table-action-button" type="link" icon={<EyeOutlined />} />
                  </Tooltip>
                ) : null}
                <PermissionGuard code="project.delete" permissions={currentAdmin.permissions}>
                  <Popconfirm title="确认删除这个项目吗？" onConfirm={() => handleDelete(item.id)}>
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
        title={editingItem ? '编辑项目' : '新建项目'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={860}
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
              <Form.Item name="title" label="项目标题" rules={[{ required: true, message: '请输入标题' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="categoryId" label="项目分类" rules={[{ required: true, message: '请选择分类' }]}>
                <Select options={categoryOptions} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="image" label="封面图片" rules={[{ required: true, message: '请输入图片地址' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="状态"
                rules={[{ required: true, message: '请选择状态' }]}
                valuePropName="checked"
                getValueProps={(value: ProjectFormValues['status']) => ({ checked: value === 'published' })}
                getValueFromEvent={(checked: boolean) => (checked ? 'published' : 'draft')}
              >
                <StatusSwitch checkedLabel="发布" uncheckedLabel="草稿" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="sortOrder" label="排序">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="description" label="项目简介">
                <Input.TextArea rows={4} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        className="admin-modal"
        title={auditAction === 'approve' ? '审核通过项目' : '驳回项目'}
        open={auditModalOpen}
        onOk={handleAuditSubmit}
        onCancel={() => {
          setAuditModalOpen(false);
          setAuditingItem(null);
        }}
        okText={auditAction === 'approve' ? '确认通过' : '确认驳回'}
        cancelText="取消"
        destroyOnHidden
      >
        <Form
          form={auditForm}
          layout="horizontal"
          labelCol={{ flex: '88px' }}
          wrapperCol={{ flex: 'auto' }}
          labelAlign="right"
          colon
          className="admin-modal-form"
        >
          <Form.Item label="项目标题">
            <Typography.Text>{auditingItem?.title || '-'}</Typography.Text>
          </Form.Item>
          <Form.Item label="发布作者">
            <Typography.Text>{auditingItem?.creatorName || '后台创建'}</Typography.Text>
          </Form.Item>
          <Form.Item
            name="comment"
            label="审核意见"
            rules={auditAction === 'reject' ? [{ required: true, message: '请输入驳回原因' }] : []}
          >
            <Input.TextArea
              rows={4}
              placeholder={auditAction === 'approve' ? '可选填写通过备注' : '请输入驳回原因，方便用户在个人中心查看'}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
