import { useEffect, useMemo, useRef, useState } from 'react';
import { DeleteOutlined, DownOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Popover,
  Radio,
  Row,
  Input as AntdInput,
  Space,
  Table,
  Tag,
  TreeSelect,
  Tooltip,
  message
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { DataNode } from 'antd/es/tree';
import { createMenu, deleteMenu, fetchMenus, type AdminMenuItem, type CurrentAdmin, updateMenu } from '../api';
import { PermissionGuard } from '../components/PermissionGuard';
import { StatusSwitch } from '../components/StatusSwitch';
import {
  menuColorfulOptions,
  menuIconOptions,
  menuIconRecommendations,
  menuMonochromeOptions,
  renderMenuIcon
} from '../utils/menu-icons';

type MenuManagementPageProps = {
  currentAdmin: CurrentAdmin;
  refreshCurrentAdmin: () => Promise<CurrentAdmin>;
};

type MenuFormValues = {
  name: string;
  parentId: number | 'root';
  path: string;
  component: string;
  permissionCode: string;
  menuKey: string;
  menuType: 'directory' | 'menu' | 'button';
  icon: string;
  status: '启用' | '停用';
  visible: '显示' | '隐藏';
  sortOrder: number;
};

type MenuTreeRow = Omit<AdminMenuItem, 'children'> & {
  level: number;
  children?: MenuTreeRow[];
};

type EditableMenu = Pick<
  AdminMenuItem,
  'id' | 'parentId' | 'name' | 'path' | 'component' | 'permissionCode' | 'menuKey' | 'menuType' | 'icon' | 'status' | 'visible' | 'sortOrder'
>;

function withLevel(items: AdminMenuItem[], level = 0): MenuTreeRow[] {
  return items.map((item) => ({
    ...item,
    level,
    children: item.children.length ? withLevel(item.children, level + 1) : undefined
  }));
}

function flattenMenus(items: AdminMenuItem[]): AdminMenuItem[] {
  return items.flatMap((item) => [item, ...flattenMenus(item.children)]);
}

function toParentTreeOptions(items: AdminMenuItem[]): DataNode[] {
  return items
    .filter((item) => item.menuType !== 'button')
    .map((item) => ({
      title: item.name,
      value: item.id,
      key: item.id,
      children: toParentTreeOptions(item.children)
    }));
}

const menuTypeLabelMap = {
  directory: '目录',
  menu: '菜单',
  button: '按钮'
} as const;

const iconPickerModes = [
  { value: 'recommended', label: '常用' },
  { value: 'monochrome', label: '线框' },
  { value: 'colorful', label: '彩色' },
  { value: 'all', label: '全部' }
] as const;

type IconPickerMode = (typeof iconPickerModes)[number]['value'];

function IconPicker({
  value,
  onChange
}: {
  value?: string;
  onChange?: (nextValue: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [mode, setMode] = useState<IconPickerMode>('recommended');
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const normalizedKeyword = keyword.trim().toLowerCase();
  const optionsByMode = useMemo<Record<IconPickerMode, typeof menuIconOptions>>(() => {
    const recommendationValues = new Set(menuIconRecommendations.map((item) => item.value));
    return {
      recommended: [...menuIconRecommendations, ...menuMonochromeOptions.filter((item) => !recommendationValues.has(item.value)).slice(0, 220)],
      monochrome: menuMonochromeOptions,
      colorful: menuColorfulOptions,
      all: menuIconOptions
    };
  }, []);
  const filteredOptions = useMemo(
    () => {
      const source = optionsByMode[mode];
      return normalizedKeyword ? source.filter((item) => item.keywords.includes(normalizedKeyword)).slice(0, 240) : source;
    },
    [mode, normalizedKeyword, optionsByMode]
  );
  const selectedOption = menuIconOptions.find((item) => item.value === value);

  return (
    <Popover
      trigger="click"
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setKeyword('');
          setMode('recommended');
        }
      }}
      placement="bottomLeft"
      overlayClassName="menu-icon-picker__popover"
      content={
        <div
          className="menu-icon-picker"
          style={{
            width: triggerRef.current?.offsetWidth,
            maxWidth: triggerRef.current?.offsetWidth
          }}
        >
          <AntdInput
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="搜索图标"
            allowClear
            autoFocus
          />
          <div className="menu-icon-picker__helper">
            {normalizedKeyword
              ? `搜索结果 ${filteredOptions.length} 项`
              : `${iconPickerModes.find((item) => item.value === mode)?.label ?? '常用'}分类，共 ${filteredOptions.length} 项，支持搜索 ${menuIconOptions.length}+ 图标`}
          </div>
          <div className="menu-icon-picker__toolbar">
            <div className="menu-icon-picker__modes" role="tablist" aria-label="图标分类">
              {iconPickerModes.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={mode === item.value ? 'menu-icon-picker__mode is-active' : 'menu-icon-picker__mode'}
                  onClick={() => setMode(item.value)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className={value ? 'menu-icon-picker__clear' : 'menu-icon-picker__clear is-active'}
              onClick={() => {
                onChange?.('');
                setOpen(false);
              }}
            >
              不设置图标
            </button>
          </div>
          <div className="menu-icon-picker__grid">
            {filteredOptions.map((item) => (
              <button
                key={item.value}
                type="button"
                className={value === item.value ? 'menu-icon-picker__item is-active' : 'menu-icon-picker__item'}
                onClick={() => {
                  onChange?.(item.value);
                  setOpen(false);
                }}
                title={`${item.setLabel} / ${item.value}`}
              >
                <span className="menu-icon-picker__glyph">{renderMenuIcon(item.value, 20)}</span>
              </button>
            ))}
          </div>
          {filteredOptions.length === 0 ? <div className="menu-icon-picker__empty">没有匹配的图标</div> : null}
        </div>
      }
    >
      <button ref={triggerRef} type="button" className="menu-icon-picker__trigger">
        <span className="menu-icon-picker__trigger-value">
          {selectedOption ? (
            <>
              <span className="menu-icon-picker__glyph">{renderMenuIcon(selectedOption.value, 18)}</span>
              <span>{selectedOption.value}</span>
            </>
          ) : (
            <span className="menu-icon-picker__placeholder">点击选择图标</span>
          )}
        </span>
        <DownOutlined className="menu-icon-picker__arrow" />
      </button>
    </Popover>
  );
}

export function MenuManagementPage({ currentAdmin, refreshCurrentAdmin }: MenuManagementPageProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [menus, setMenus] = useState<AdminMenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EditableMenu | null>(null);
  const [createParentId, setCreateParentId] = useState<number | 'root' | null>(null);
  const [form] = Form.useForm<MenuFormValues>();
  const currentMenuType = Form.useWatch('menuType', form) || 'menu';

  const loadData = async () => {
    setLoading(true);
    try {
      setMenus(await fetchMenus());
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '菜单数据加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const tableData = useMemo(() => withLevel(menus), [menus]);
  const parentTreeOptions = useMemo(
    () => [
      { title: '顶级菜单', value: 'root' as const, key: 'root' },
      ...toParentTreeOptions(menus)
    ],
    [menus]
  );

  const columns: ColumnsType<MenuTreeRow> = [
    {
      title: '菜单名称',
      dataIndex: 'name',
      render: (_, item) => (
        <div className={`menu-node menu-node--${item.menuType}`}>
          <div className="menu-node__content">
            <div className="menu-node__main">
              <Tag color={item.menuType === 'directory' ? 'blue' : item.menuType === 'menu' ? 'green' : 'orange'}>
                {menuTypeLabelMap[item.menuType]}
              </Tag>
              {item.sourceType === 'permission' ? <Tag color="purple">权限映射</Tag> : null}
              {item.icon ? <span className="menu-node__icon">{renderMenuIcon(item.icon, 16)}</span> : null}
              <span className="menu-node__title">{item.name}</span>
            </div>
          </div>
        </div>
      )
    },
    { title: '路由路径', dataIndex: 'path' },
    { title: '组件路径', dataIndex: 'component' },
    { title: '权限字符', dataIndex: 'permissionCode' },
    { title: '菜单标识', dataIndex: 'menuKey' },
    {
      title: '显示',
      dataIndex: 'visible',
      width: 100,
      render: (value: string) => (
        <StatusSwitch checked={value === '显示'} checkedLabel="显示" uncheckedLabel="隐藏" disabled size="small" />
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (value: string) => (
        <StatusSwitch checked={value === '启用'} checkedLabel="启用" uncheckedLabel="停用" disabled size="small" />
      )
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 132,
      render: (_, item) => (
        <Space size={0} className="table-actions">
          {item.sourceType === 'permission' ? (
            <Tooltip title="按钮权限由后端定义，这里只展示挂载关系">
              <Button className="table-action-button" type="link" disabled icon={<EditOutlined />} />
            </Tooltip>
          ) : (
            <>
          {item.level <= 1 && item.menuType !== 'button' ? (
            <PermissionGuard code="menu.create" permissions={currentAdmin.permissions}>
              <Tooltip title={item.menuType === 'directory' ? '添加子菜单' : '添加按钮权限'}>
                <Button
                  className="table-action-button"
                  type="link"
                  icon={<PlusOutlined />}
                  onClick={() => openCreateChildModal(item)}
                />
              </Tooltip>
            </PermissionGuard>
          ) : null}
          <PermissionGuard code="menu.edit" permissions={currentAdmin.permissions}>
            <Tooltip title="编辑">
              <Button className="table-action-button" type="link" icon={<EditOutlined />} onClick={() => openEditModal(item)} />
            </Tooltip>
          </PermissionGuard>
          <PermissionGuard code="menu.delete" permissions={currentAdmin.permissions}>
            <Popconfirm title="确认删除这个菜单吗？" onConfirm={() => handleDelete(item.id)}>
              <Tooltip title="删除">
                <Button danger className="table-action-button" type="link" icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          </PermissionGuard>
            </>
          )}
        </Space>
      )
    }
  ];

  const openCreateModal = () => {
    setEditingItem(null);
    setCreateParentId(null);
    form.setFieldsValue({
      name: '',
      parentId: 'root',
      path: '',
      component: '',
      permissionCode: '',
      menuKey: '',
      menuType: 'menu',
      icon: '',
      status: '启用',
      visible: '显示',
      sortOrder: flattenMenus(menus).filter((item) => item.sourceType !== 'permission').length + 1
    });
    setModalOpen(true);
  };

  const openCreateChildModal = (parent: MenuTreeRow) => {
    setEditingItem(null);
    setCreateParentId(parent.id);
    const childMenuType: MenuFormValues['menuType'] = parent.menuType === 'directory' ? 'menu' : 'button';
    form.setFieldsValue({
      name: '',
      parentId: parent.id,
      path: '',
      component: '',
      permissionCode: '',
      menuKey: '',
      menuType: childMenuType,
      icon: '',
      status: '启用',
      visible: '显示',
      sortOrder: (parent.children?.length ?? 0) + 1
    });
    setModalOpen(true);
  };

  const openEditModal = (item: EditableMenu) => {
    setEditingItem(item);
    setCreateParentId(null);
    form.setFieldsValue({
      name: item.name,
      parentId: item.parentId ?? 'root',
      path: item.path,
      component: item.component,
      permissionCode: item.permissionCode,
      menuKey: item.menuKey,
      menuType: item.menuType,
      icon: item.icon,
      status: item.status,
      visible: item.visible,
      sortOrder: item.sortOrder
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const payload = {
      parentId: values.parentId === 'root' ? null : values.parentId,
      name: values.name,
      path: values.menuType === 'button' ? '' : values.path,
      component: values.menuType === 'menu' ? values.component : '',
      permissionCode: values.menuType === 'directory' ? '' : values.permissionCode,
      menuKey: values.menuKey,
      menuType: values.menuType,
      icon: values.icon,
      status: values.status,
      visible: values.visible,
      sortOrder: values.sortOrder
    };

    try {
      if (editingItem) {
        await updateMenu(editingItem.id, payload);
        messageApi.success('菜单更新成功');
      } else {
        await createMenu(payload);
        messageApi.success('菜单创建成功');
      }

      setModalOpen(false);
      await loadData();
      await refreshCurrentAdmin();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '菜单保存失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMenu(id);
      messageApi.success('菜单已删除');
      await loadData();
      await refreshCurrentAdmin();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '菜单删除失败');
    }
  };

  return (
    <Card>
      {contextHolder}
      <Space className="filter-bar" wrap>
        <PermissionGuard code="menu.create" permissions={currentAdmin.permissions}>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            新建菜单
          </Button>
        </PermissionGuard>
      </Space>

      <Table
        rowKey="id"
        loading={loading}
        pagination={{ defaultPageSize: 10, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'] }}
        defaultExpandAllRows
        indentSize={24}
        dataSource={tableData}
        scroll={{ x: 'max-content' }}
        columns={columns}
        rowClassName={(item) =>
          item.menuType === 'directory' ? 'menu-table-row menu-table-row--directory' : 'menu-table-row'
        }
      />

      <Modal
        className="admin-modal"
        title={editingItem ? '编辑菜单' : createParentId ? '新建子菜单' : '新建菜单'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={860}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="horizontal"
          labelCol={{ flex: '96px' }}
          wrapperCol={{ flex: 'auto' }}
          labelAlign="right"
          colon
          className="admin-modal-form admin-modal-form--menu"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="parentId" label="上级菜单" rules={[{ required: true, message: '请选择上级菜单' }]}>
                <TreeSelect treeData={parentTreeOptions} treeDefaultExpandAll placeholder="请选择上级菜单" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="name" label="菜单名称" rules={[{ required: true, message: '请输入菜单名称' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="menuType" label="菜单类型" rules={[{ required: true, message: '请选择菜单类型' }]}>
                <Radio.Group
                  options={[
                    { label: '目录', value: 'directory' },
                    { label: '菜单', value: 'menu' },
                    { label: '按钮', value: 'button' }
                  ]}
                />
              </Form.Item>
            </Col>
            {currentMenuType === 'menu' ? (
              <Col span={12}>
                <Form.Item
                  name="path"
                  label="路由路径"
                  rules={[{ required: true, message: '请输入路由路径' }]}
                >
                  <Input />
                </Form.Item>
              </Col>
            ) : null}
            {currentMenuType === 'menu' ? (
              <Col span={12}>
                <Form.Item name="component" label="组件路径" rules={[{ required: true, message: '请输入组件路径' }]}>
                  <Input />
                </Form.Item>
              </Col>
            ) : null}
            {currentMenuType !== 'directory' ? (
              <Col span={12}>
                <Form.Item
                  name="permissionCode"
                  label="权限字符"
                  rules={currentMenuType === 'button' ? [{ required: true, message: '请输入权限字符' }] : []}
                >
                  <Input />
                </Form.Item>
              </Col>
            ) : null}
            <Col span={12}>
              <Form.Item name="menuKey" label="菜单标识" rules={[{ required: true, message: '请输入菜单标识' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="visible"
                label="显示状态"
                rules={[{ required: true, message: '请选择显示状态' }]}
                valuePropName="checked"
                getValueProps={(value: MenuFormValues['visible']) => ({ checked: value === '显示' })}
                getValueFromEvent={(checked: boolean) => (checked ? '显示' : '隐藏')}
              >
                <StatusSwitch checkedLabel="显示" uncheckedLabel="隐藏" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="状态"
                rules={[{ required: true, message: '请选择状态' }]}
                valuePropName="checked"
                getValueProps={(value: MenuFormValues['status']) => ({ checked: value === '启用' })}
                getValueFromEvent={(checked: boolean) => (checked ? '启用' : '停用')}
              >
                <StatusSwitch checkedLabel="启用" uncheckedLabel="停用" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="sortOrder" label="排序">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            {currentMenuType !== 'button' ? (
              <Col span={24}>
                <Form.Item name="icon" label="图标名称">
                  <IconPicker />
                </Form.Item>
              </Col>
            ) : null}
          </Row>
        </Form>
      </Modal>
    </Card>
  );
}
