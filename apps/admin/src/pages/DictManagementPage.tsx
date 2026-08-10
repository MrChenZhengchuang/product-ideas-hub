import { useEffect, useMemo, useRef, useState } from 'react';
import { CaretRightOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Empty,
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
  Typography,
  message
} from 'antd';
import { PermissionGuard } from '../components/PermissionGuard';
import { StatusSwitch } from '../components/StatusSwitch';
import {
  createDictItem,
  createDictType,
  deleteDictItem,
  deleteDictType,
  fetchDictItems,
  fetchDictTypes,
  type CurrentAdmin,
  type DictDataItem,
  type DictTypeItem,
  updateDictItem,
  updateDictType
} from '../api';

type DictManagementPageProps = {
  currentAdmin: CurrentAdmin;
};

type DictTypeFormValues = Omit<DictTypeItem, 'id' | 'itemCount'>;

type DictItemFormValues = {
  parentId: number | null;
  label: string;
  value: string;
  status: '启用' | '停用';
  sortOrder: number;
  remark: string;
};

type TreeOption = {
  title: string;
  value: number;
  key: number;
  children?: TreeOption[];
};

function buildItemTreeOptions(items: DictDataItem[], currentId?: number): TreeOption[] {
  const filtered = items.filter((item) => item.id !== currentId);
  const childrenMap = new Map<number | null, DictDataItem[]>();

  for (const item of filtered) {
    const parentId = item.parentId;
    const bucket = childrenMap.get(parentId) ?? [];
    bucket.push(item);
    childrenMap.set(parentId, bucket);
  }

  const buildNodes = (parentId: number | null): TreeOption[] =>
    (childrenMap.get(parentId) ?? [])
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((item) => {
        const children = buildNodes(item.id);
        return {
          title: item.label,
          value: item.id,
          key: item.id,
          ...(children.length ? { children } : {})
        };
      });

  return buildNodes(null);
}

function flattenDictItems(items: DictDataItem[]): DictDataItem[] {
  return items.flatMap((item) => {
    const childRows = item.children?.length ? flattenDictItems(item.children) : [];
    return [item, ...childRows];
  });
}

function buildDictItemTableTree(items: DictDataItem[]): DictDataItem[] {
  const nodeMap = new Map<number, DictDataItem>();
  const roots: DictDataItem[] = [];

  for (const row of items) {
    nodeMap.set(row.id, { ...row, children: [] });
  }

  for (const row of items) {
    const node = nodeMap.get(row.id)!;
    const parentId = row.parentId;

    if (parentId == null || parentId === 0) {
      roots.push(node);
      continue;
    }

    const parent = nodeMap.get(parentId);
    if (parent) {
      parent.children!.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortNodes = (nodes: DictDataItem[]): DictDataItem[] =>
    [...nodes]
      .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0) || left.id - right.id)
      .map((node) => ({
        ...node,
        children: node.children?.length ? sortNodes(node.children) : []
      }));

  return sortNodes(roots);
}

/** 将接口数据（平铺或已嵌套）统一为表格树形结构 */
function toTableTreeData(items: DictDataItem[]): DictDataItem[] {
  if (!items.length) {
    return [];
  }

  const flatRows = items.some((item) => item.children?.length)
    ? flattenDictItems(items).map(({ children: _children, ...item }) => item)
    : items.map(({ children: _children, ...item }) => item);

  return buildDictItemTableTree(flatRows);
}

export function DictManagementPage({ currentAdmin }: DictManagementPageProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [dictTypes, setDictTypes] = useState<DictTypeItem[]>([]);
  const [selectedType, setSelectedType] = useState<DictTypeItem | null>(null);
  const [dictItems, setDictItems] = useState<DictDataItem[]>([]);
  const [pickerItems, setPickerItems] = useState<DictDataItem[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [typeKeyword, setTypeKeyword] = useState('');
  const [typeStatus, setTypeStatus] = useState<string>();
  const [itemKeyword, setItemKeyword] = useState('');
  const [itemStatus, setItemStatus] = useState<string>();
  const [typePagination, setTypePagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [itemPagination, setItemPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<DictTypeItem | null>(null);
  const [editingItem, setEditingItem] = useState<DictDataItem | null>(null);
  const [typeForm] = Form.useForm<DictTypeFormValues>();
  const [itemForm] = Form.useForm<DictItemFormValues>();
  const selectedTypeIdRef = useRef<number | null>(null);

  const itemTreeOptions = useMemo(
    () => [{ title: '顶级字典项', value: 0, key: 0 }, ...buildItemTreeOptions(pickerItems, editingItem?.id)],
    [pickerItems, editingItem]
  );

  const parentLabelMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const item of flattenDictItems([...dictItems, ...pickerItems])) {
      map.set(item.id, item.label);
    }
    return map;
  }, [pickerItems, dictItems]);

  const loadDictTypes = async (page = typePagination.current, pageSize = typePagination.pageSize) => {
    setLoadingTypes(true);
    try {
      const result = await fetchDictTypes({ keyword: typeKeyword, status: typeStatus, page, pageSize });
      setDictTypes(result.list);
      setTypePagination({
        current: result.page,
        pageSize: result.pageSize,
        total: result.total
      });

      setSelectedType((prev) => {
        if (!result.list.length) {
          return null;
        }
        if (prev) {
          return result.list.find((item) => item.id === prev.id) || result.list[0];
        }
        return result.list[0];
      });
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '字典类型加载失败');
    } finally {
      setLoadingTypes(false);
    }
  };

  const loadDictItems = async (
    dictTypeId: number,
    page = itemPagination.current,
    pageSize = itemPagination.pageSize
  ) => {
    setLoadingItems(true);
    try {
      const result = await fetchDictItems(dictTypeId, {
        keyword: itemKeyword,
        status: itemStatus,
        viewMode: 'tree',
        page,
        pageSize
      });
      setDictItems(toTableTreeData(result.list));
      setItemPagination({
        current: result.page,
        pageSize: result.pageSize,
        total: result.total
      });
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '字典项加载失败');
    } finally {
      setLoadingItems(false);
    }
  };

  const loadPickerItems = async (dictTypeId: number) => {
    const result = await fetchDictItems(dictTypeId, { viewMode: 'flat', page: 1, pageSize: 500 });
    setPickerItems(result.list.map(({ children: _children, ...item }) => item));
  };

  useEffect(() => {
    setTypePagination((prev) => ({ ...prev, current: 1 }));
    loadDictTypes(1, typePagination.pageSize);
  }, [typeKeyword, typeStatus]);

  useEffect(() => {
    const dictTypeId = selectedType?.id;
    if (!dictTypeId) {
      selectedTypeIdRef.current = null;
      setDictItems([]);
      setPickerItems([]);
      return;
    }

    if (selectedTypeIdRef.current === dictTypeId) {
      return;
    }

    selectedTypeIdRef.current = dictTypeId;
    setItemPagination((prev) => ({ ...prev, current: 1 }));
    setPickerItems([]);
    loadDictItems(dictTypeId, 1, itemPagination.pageSize);
  }, [selectedType?.id]);

  useEffect(() => {
    const dictTypeId = selectedType?.id;
    if (!dictTypeId || selectedTypeIdRef.current !== dictTypeId) {
      return;
    }

    setItemPagination((prev) => ({ ...prev, current: 1 }));
    loadDictItems(dictTypeId, 1, itemPagination.pageSize);
  }, [itemKeyword, itemStatus]);

  const openCreateTypeModal = () => {
    setEditingType(null);
    typeForm.setFieldsValue({
      name: '',
      code: '',
      valueType: '字符串',
      status: '启用',
      sortOrder: dictTypes.length + 1,
      remark: ''
    });
    setTypeModalOpen(true);
  };

  const openEditTypeModal = (item: DictTypeItem) => {
    setEditingType(item);
    typeForm.setFieldsValue({
      name: item.name,
      code: item.code,
      valueType: item.valueType,
      status: item.status,
      sortOrder: item.sortOrder,
      remark: item.remark
    });
    setTypeModalOpen(true);
  };

  const openCreateItemModal = async () => {
    if (!selectedType) {
      return;
    }

    let items: DictDataItem[] = [];

    try {
      const result = await fetchDictItems(selectedType.id, { viewMode: 'flat', page: 1, pageSize: 500 });
      items = result.list.map(({ children: _children, ...item }) => item);
      setPickerItems(items);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '字典项选项加载失败');
      return;
    }

    setEditingItem(null);
    itemForm.setFieldsValue({
      parentId: 0,
      label: '',
      value: '',
      status: '启用',
      sortOrder: items.length + 1,
      remark: ''
    });
    setItemModalOpen(true);
  };

  const openEditItemModal = async (item: DictDataItem) => {
    if (!selectedType) {
      return;
    }

    try {
      await loadPickerItems(selectedType.id);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '字典项选项加载失败');
      return;
    }

    setEditingItem(item);
    itemForm.setFieldsValue({
      parentId: item.parentId ?? 0,
      label: item.label,
      value: item.value,
      status: item.status,
      sortOrder: item.sortOrder,
      remark: item.remark
    });
    setItemModalOpen(true);
  };

  const handleTypeSubmit = async () => {
    const values = await typeForm.validateFields();

    try {
      if (editingType) {
        await updateDictType(editingType.id, values);
        messageApi.success('字典类型更新成功');
      } else {
        await createDictType(values);
        messageApi.success('字典类型创建成功');
      }
      setTypeModalOpen(false);
      await loadDictTypes();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '字典类型保存失败');
    }
  };

  const handleItemSubmit = async () => {
    if (!selectedType) {
      return;
    }

    const values = await itemForm.validateFields();
    const payload = {
      dictTypeId: selectedType.id,
      parentId: values.parentId && values.parentId > 0 ? values.parentId : null,
      label: values.label,
      value: values.value,
      status: values.status,
      sortOrder: values.sortOrder,
      remark: values.remark || ''
    };

    try {
      if (editingItem) {
        await updateDictItem(editingItem.id, payload);
        messageApi.success('字典项更新成功');
      } else {
        await createDictItem(payload);
        messageApi.success('字典项创建成功');
      }
      setItemModalOpen(false);
      await Promise.all([
        loadDictTypes(),
        loadDictItems(selectedType.id, itemPagination.current, itemPagination.pageSize),
        loadPickerItems(selectedType.id)
      ]);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '字典项保存失败');
    }
  };

  const handleDeleteType = async (id: number) => {
    try {
      await deleteDictType(id);
      messageApi.success('字典类型已删除');
      await loadDictTypes();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '字典类型删除失败');
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (!selectedType) {
      return;
    }

    try {
      await deleteDictItem(id);
      messageApi.success('字典项已删除');
      await Promise.all([
        loadDictTypes(),
        loadDictItems(selectedType.id, itemPagination.current, itemPagination.pageSize)
      ]);
      if (pickerItems.length) {
        await loadPickerItems(selectedType.id);
      }
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '字典项删除失败');
    }
  };

  return (
    <Row gutter={16}>
      {contextHolder}
      <Col xs={24} xl={8}>
        <Card>
          <Space className="filter-bar" wrap>
            <Input.Search allowClear placeholder="搜索字典名称或编码" style={{ width: 220 }} onSearch={(value) => setTypeKeyword(value)} />
            <Select
              allowClear
              placeholder="状态"
              style={{ width: 120 }}
              options={[{ label: '启用', value: '启用' }, { label: '停用', value: '停用' }]}
              onChange={(value) => setTypeStatus(value)}
            />
            <PermissionGuard code="dict.create" permissions={currentAdmin.permissions}>
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreateTypeModal}>
                新增字典
              </Button>
            </PermissionGuard>
          </Space>

          <Table
            rowKey="id"
            showHeader={false}
            loading={loadingTypes}
            pagination={{
              current: typePagination.current,
              pageSize: typePagination.pageSize,
              total: typePagination.total,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50'],
              onChange: (page, pageSize) => {
                loadDictTypes(page, pageSize);
              }
            }}
            dataSource={dictTypes}
            rowClassName={(record) => (record.id === selectedType?.id ? 'ant-table-row-selected' : '')}
            onRow={(record) => ({
              onClick: () => {
                if (record.id !== selectedType?.id) {
                  setSelectedType(record);
                }
              }
            })}
            columns={[
              {
                title: '字典',
                dataIndex: 'name',
                render: (_, item) => (
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Space wrap>
                      <Typography.Text strong>{item.name}</Typography.Text>
                      <StatusSwitch checked={item.status === '启用'} checkedLabel="启用" uncheckedLabel="停用" disabled size="small" />
                    </Space>
                    <Typography.Text type="secondary">{item.code}</Typography.Text>
                    <Space size={8} wrap>
                      <Typography.Text type="secondary">类型：{item.valueType}</Typography.Text>
                      <Typography.Text type="secondary">字典项：{item.itemCount}</Typography.Text>
                    </Space>
                  </Space>
                )
              },
              {
                title: '操作',
                key: 'action',
                width: 72,
                render: (_, item) => (
                  <Space size={0} className="table-actions">
                    <PermissionGuard code="dict.edit" permissions={currentAdmin.permissions}>
                      <Tooltip title="编辑">
                        <Button className="table-action-button" type="link" icon={<EditOutlined />} onClick={(event) => {
                          event.stopPropagation();
                          openEditTypeModal(item);
                        }} />
                      </Tooltip>
                    </PermissionGuard>
                    <PermissionGuard code="dict.delete" permissions={currentAdmin.permissions}>
                      <Popconfirm title="确认删除这个字典吗？" onConfirm={() => handleDeleteType(item.id)}>
                        <Tooltip title="删除">
                          <Button danger className="table-action-button" type="link" icon={<DeleteOutlined />} onClick={(event) => event.stopPropagation()} />
                        </Tooltip>
                      </Popconfirm>
                    </PermissionGuard>
                  </Space>
                )
              }
            ]}
          />
        </Card>
      </Col>

      <Col xs={24} xl={16}>
        <Card
          title={selectedType ? `字典项：${selectedType.name}` : '字典项'}
          extra={
            selectedType ? (
              <Space wrap>
                <PermissionGuard code="dict.create" permissions={currentAdmin.permissions}>
                  <Button type="primary" icon={<PlusOutlined />} onClick={openCreateItemModal}>
                    新增字典项
                  </Button>
                </PermissionGuard>
              </Space>
            ) : null
          }
        >
          {selectedType ? (
            <>
              <Space className="filter-bar" wrap>
                <Input.Search allowClear placeholder="搜索 label 或 value" style={{ width: 260 }} onSearch={(value) => setItemKeyword(value)} />
                <Select
                  allowClear
                  placeholder="筛选状态"
                  style={{ width: 160 }}
                  options={[{ label: '启用', value: '启用' }, { label: '停用', value: '停用' }]}
                  onChange={(value) => setItemStatus(value)}
                />
              </Space>

              <Table
                rowKey="id"
                loading={loadingItems}
                pagination={{
                  current: itemPagination.current,
                  pageSize: itemPagination.pageSize,
                  total: itemPagination.total,
                  showSizeChanger: true,
                  pageSizeOptions: ['10', '20', '50'],
                  onChange: (page, pageSize) => {
                    loadDictItems(selectedType.id, page, pageSize);
                  }
                }}
                dataSource={dictItems}
                indentSize={24}
                expandable={{
                  rowExpandable: (record) => Boolean(record.children?.length),
                  expandIcon: ({ expanded, onExpand, record }) => {
                    if (!record.children?.length) {
                      return <span className="ant-table-row-expand-icon-spaced" style={{ display: 'inline-block', width: 17 }} />;
                    }

                    return (
                      <CaretRightOutlined
                        rotate={expanded ? 90 : 0}
                        onClick={(event) => onExpand(record, event)}
                        style={{ cursor: 'pointer', color: 'rgba(0, 0, 0, 0.45)' }}
                      />
                    );
                  }
                }}
                scroll={{ x: 'max-content' }}
                columns={[
                  { title: '标签', dataIndex: 'label' },
                  { title: '键值', dataIndex: 'value' },
                  {
                    title: '上级项',
                    dataIndex: 'parentId',
                    width: 120,
                    render: (value: number | null) => (value ? parentLabelMap.get(value) || '-' : '-')
                  },
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
                        <PermissionGuard code="dict.edit" permissions={currentAdmin.permissions}>
                          <Tooltip title="编辑">
                            <Button className="table-action-button" type="link" icon={<EditOutlined />} onClick={() => openEditItemModal(item)} />
                          </Tooltip>
                        </PermissionGuard>
                        <PermissionGuard code="dict.delete" permissions={currentAdmin.permissions}>
                          <Popconfirm title="确认删除这个字典项吗？" onConfirm={() => handleDeleteItem(item.id)}>
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
            </>
          ) : (
            <Empty description="请先选择一个字典类型" />
          )}
        </Card>
      </Col>

      <Modal
        className="admin-modal"
        title={editingType ? '编辑字典' : '新增字典'}
        open={typeModalOpen}
        onOk={handleTypeSubmit}
        onCancel={() => setTypeModalOpen(false)}
        width={760}
        destroyOnHidden
      >
        <Form form={typeForm} layout="horizontal" labelCol={{ flex: '88px' }} wrapperCol={{ flex: 'auto' }} labelAlign="right" colon className="admin-modal-form">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="字典名称" rules={[{ required: true, message: '请输入字典名称' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="code" label="字典编码" rules={[{ required: true, message: '请输入字典编码' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="valueType" label="值类型">
                <Select options={['字符串', '数字', '布尔'].map((item) => ({ label: item, value: item }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="状态"
                valuePropName="checked"
                getValueProps={(value: DictTypeFormValues['status']) => ({ checked: value === '启用' })}
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

      <Modal
        className="admin-modal"
        title={editingItem ? '编辑字典项' : '新增字典项'}
        open={itemModalOpen}
        onOk={handleItemSubmit}
        onCancel={() => setItemModalOpen(false)}
        width={760}
        destroyOnHidden
      >
        <Form form={itemForm} layout="horizontal" labelCol={{ flex: '88px' }} wrapperCol={{ flex: 'auto' }} labelAlign="right" colon className="admin-modal-form">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="parentId" label="上级项">
                <TreeSelect treeData={itemTreeOptions} placeholder="请选择上级字典项" treeDefaultExpandAll allowClear />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="label" label="Label" rules={[{ required: true, message: '请输入 label' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="value" label="Value" rules={[{ required: true, message: '请输入 value' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="状态"
                valuePropName="checked"
                getValueProps={(value: DictItemFormValues['status']) => ({ checked: value === '启用' })}
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
    </Row>
  );
}
