CREATE DATABASE IF NOT EXISTS product_ideas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE product_ideas;

CREATE TABLE IF NOT EXISTS project_categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  category_key VARCHAR(50) NOT NULL UNIQUE,
  category_name VARCHAR(50) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS projects (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(100) NOT NULL,
  description VARCHAR(255) NOT NULL DEFAULT '',
  summary VARCHAR(255) NOT NULL DEFAULT '',
  content TEXT NULL,
  category_id INT NOT NULL,
  cover_image VARCHAR(255) NOT NULL,
  creator_user_id INT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'published',
  audit_status VARCHAR(20) NOT NULL DEFAULT 'approved',
  audit_comment VARCHAR(255) NOT NULL DEFAULT '',
  audited_by INT NULL,
  audited_at DATETIME NULL,
  published_at DATETIME NULL,
  view_count INT NOT NULL DEFAULT 0,
  favorite_count INT NOT NULL DEFAULT 0,
  like_count INT NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_projects_category FOREIGN KEY (category_id) REFERENCES project_categories (id)
);

CREATE TABLE IF NOT EXISTS roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  scope VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT '启用'
);

SET @stmt = IF(
  EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'roles' AND column_name = 'status'
  ),
  'SELECT 1',
  'ALTER TABLE roles ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT ''启用'' AFTER scope'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS departments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  parent_id INT NULL,
  name VARCHAR(80) NOT NULL,
  phone VARCHAR(20) NOT NULL DEFAULT '',
  email VARCHAR(80) NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT '启用',
  sort_order INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_departments_parent FOREIGN KEY (parent_id) REFERENCES departments (id)
);

CREATE TABLE IF NOT EXISTS admin_users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  account VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL DEFAULT '',
  email VARCHAR(80) NOT NULL DEFAULT '',
  avatar VARCHAR(500) NOT NULL DEFAULT '',
  role_id INT NOT NULL,
  department_id INT NULL,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_admin_users_role FOREIGN KEY (role_id) REFERENCES roles (id),
  CONSTRAINT fk_admin_users_department FOREIGN KEY (department_id) REFERENCES departments (id)
);

CREATE TABLE IF NOT EXISTS department_leaders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  department_id INT NOT NULL,
  admin_user_id INT NOT NULL,
  is_primary TINYINT(1) NOT NULL DEFAULT 0,
  phone VARCHAR(20) NOT NULL DEFAULT '',
  email VARCHAR(80) NOT NULL DEFAULT '',
  UNIQUE KEY uniq_department_leader (department_id, admin_user_id),
  CONSTRAINT fk_department_leaders_department FOREIGN KEY (department_id) REFERENCES departments (id),
  CONSTRAINT fk_department_leaders_user FOREIGN KEY (admin_user_id) REFERENCES admin_users (id)
);

SET @stmt = IF(
  EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'department_leaders' AND column_name = 'phone'
  ),
  'SELECT 1',
  'ALTER TABLE department_leaders ADD COLUMN phone VARCHAR(20) NOT NULL DEFAULT '''' AFTER is_primary'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = IF(
  EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'department_leaders' AND column_name = 'email'
  ),
  'SELECT 1',
  'ALTER TABLE department_leaders ADD COLUMN email VARCHAR(80) NOT NULL DEFAULT '''' AFTER phone'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = IF(
  EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'admin_users' AND column_name = 'department_id'
  ),
  'SELECT 1',
  'ALTER TABLE admin_users ADD COLUMN department_id INT NULL AFTER role_id'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = IF(
  EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'admin_users' AND column_name = 'phone'
  ),
  'SELECT 1',
  'ALTER TABLE admin_users ADD COLUMN phone VARCHAR(20) NOT NULL DEFAULT '''' AFTER password'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = IF(
  EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'admin_users' AND column_name = 'email'
  ),
  'SELECT 1',
  'ALTER TABLE admin_users ADD COLUMN email VARCHAR(80) NOT NULL DEFAULT '''' AFTER phone'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = IF(
  EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'admin_users' AND column_name = 'created_at'
  ),
  'SELECT 1',
  'ALTER TABLE admin_users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER status'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = IF(
  EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'admin_users' AND column_name = 'avatar'
  ),
  'SELECT 1',
  'ALTER TABLE admin_users ADD COLUMN avatar VARCHAR(500) NOT NULL DEFAULT '''' AFTER email'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS admin_user_roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  admin_user_id INT NOT NULL,
  role_id INT NOT NULL,
  UNIQUE KEY uniq_admin_user_role (admin_user_id, role_id),
  CONSTRAINT fk_admin_user_roles_user FOREIGN KEY (admin_user_id) REFERENCES admin_users (id),
  CONSTRAINT fk_admin_user_roles_role FOREIGN KEY (role_id) REFERENCES roles (id)
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  admin_user_id INT NOT NULL,
  session_token VARCHAR(64) NOT NULL UNIQUE,
  device_type VARCHAR(20) NOT NULL DEFAULT 'desktop',
  device_name VARCHAR(120) NOT NULL DEFAULT '',
  browser VARCHAR(80) NOT NULL DEFAULT '',
  os VARCHAR(80) NOT NULL DEFAULT '',
  ip_address VARCHAR(64) NOT NULL DEFAULT '',
  is_current TINYINT(1) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT '在线',
  last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP NULL DEFAULT NULL,
  CONSTRAINT fk_admin_sessions_user FOREIGN KEY (admin_user_id) REFERENCES admin_users (id)
);

CREATE TABLE IF NOT EXISTS admin_preferences (
  id INT PRIMARY KEY AUTO_INCREMENT,
  admin_user_id INT NOT NULL,
  color_primary VARCHAR(20) NOT NULL DEFAULT '#0f766e',
  show_page_tabs TINYINT(1) NOT NULL DEFAULT 1,
  compact_content TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_admin_preferences_user (admin_user_id),
  CONSTRAINT fk_admin_preferences_user FOREIGN KEY (admin_user_id) REFERENCES admin_users (id)
);

CREATE TABLE IF NOT EXISTS admin_integrations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  app_key VARCHAR(50) NOT NULL UNIQUE,
  app_name VARCHAR(80) NOT NULL,
  app_type VARCHAR(30) NOT NULL DEFAULT '协作',
  description VARCHAR(255) NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT '启用',
  icon VARCHAR(40) NOT NULL DEFAULT 'appstore',
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS admin_integration_bindings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  admin_user_id INT NOT NULL,
  integration_id INT NOT NULL,
  account_name VARCHAR(100) NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT '已绑定',
  bound_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_admin_integration_binding (admin_user_id, integration_id),
  CONSTRAINT fk_admin_integration_bindings_user FOREIGN KEY (admin_user_id) REFERENCES admin_users (id),
  CONSTRAINT fk_admin_integration_bindings_integration FOREIGN KEY (integration_id) REFERENCES admin_integrations (id)
);

INSERT INTO admin_integrations (app_key, app_name, app_type, description, status, icon, sort_order)
SELECT 'wecom', '企业微信', '协作', '同步组织沟通与通知触达。', '启用', 'message', 10
WHERE NOT EXISTS (SELECT 1 FROM admin_integrations WHERE app_key = 'wecom');

INSERT INTO admin_integrations (app_key, app_name, app_type, description, status, icon, sort_order)
SELECT 'dingtalk', '钉钉', '协作', '用于审批提醒与移动办公接入。', '启用', 'notification', 20
WHERE NOT EXISTS (SELECT 1 FROM admin_integrations WHERE app_key = 'dingtalk');

INSERT INTO admin_integrations (app_key, app_name, app_type, description, status, icon, sort_order)
SELECT 'feishu', '飞书', '协作', '统一消息、日历与知识协同。', '维护中', 'rocket', 30
WHERE NOT EXISTS (SELECT 1 FROM admin_integrations WHERE app_key = 'feishu');

INSERT INTO admin_integrations (app_key, app_name, app_type, description, status, icon, sort_order)
SELECT 'github', 'GitHub', '研发', '关联代码仓库与发布流水线。', '启用', 'github', 40
WHERE NOT EXISTS (SELECT 1 FROM admin_integrations WHERE app_key = 'github');

CREATE TABLE IF NOT EXISTS site_users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nickname VARCHAR(50) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  member_level VARCHAR(30) NOT NULL,
  status VARCHAR(20) NOT NULL
);

CREATE TABLE IF NOT EXISTS dict_types (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(80) NOT NULL,
  code VARCHAR(80) NOT NULL UNIQUE,
  value_type VARCHAR(20) NOT NULL DEFAULT '字符串',
  status VARCHAR(20) NOT NULL DEFAULT '启用',
  sort_order INT NOT NULL DEFAULT 0,
  remark VARCHAR(255) NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS dict_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  dict_type_id INT NOT NULL,
  parent_id INT NULL,
  label VARCHAR(80) NOT NULL,
  value VARCHAR(80) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT '启用',
  sort_order INT NOT NULL DEFAULT 0,
  remark VARCHAR(255) NOT NULL DEFAULT '',
  CONSTRAINT fk_dict_items_type FOREIGN KEY (dict_type_id) REFERENCES dict_types (id),
  CONSTRAINT fk_dict_items_parent FOREIGN KEY (parent_id) REFERENCES dict_items (id)
);

SET @stmt = IF(
  EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'projects' AND column_name = 'creator_user_id'
  ),
  'SELECT 1',
  'ALTER TABLE projects ADD COLUMN creator_user_id INT NULL AFTER cover_image'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = IF(
  EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'projects' AND column_name = 'summary'
  ),
  'SELECT 1',
  'ALTER TABLE projects ADD COLUMN summary VARCHAR(255) NOT NULL DEFAULT '''' AFTER description'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = IF(
  EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'projects' AND column_name = 'content'
  ),
  'SELECT 1',
  'ALTER TABLE projects ADD COLUMN content TEXT NULL AFTER summary'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = IF(
  EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'projects' AND column_name = 'audit_status'
  ),
  'SELECT 1',
  'ALTER TABLE projects ADD COLUMN audit_status VARCHAR(20) NOT NULL DEFAULT ''approved'' AFTER status'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = IF(
  EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'projects' AND column_name = 'audit_comment'
  ),
  'SELECT 1',
  'ALTER TABLE projects ADD COLUMN audit_comment VARCHAR(255) NOT NULL DEFAULT '''' AFTER audit_status'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = IF(
  EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'projects' AND column_name = 'audited_by'
  ),
  'SELECT 1',
  'ALTER TABLE projects ADD COLUMN audited_by INT NULL AFTER audit_comment'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = IF(
  EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'projects' AND column_name = 'audited_at'
  ),
  'SELECT 1',
  'ALTER TABLE projects ADD COLUMN audited_at DATETIME NULL AFTER audited_by'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = IF(
  EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'projects' AND column_name = 'published_at'
  ),
  'SELECT 1',
  'ALTER TABLE projects ADD COLUMN published_at DATETIME NULL AFTER audited_at'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = IF(
  EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'projects' AND column_name = 'view_count'
  ),
  'SELECT 1',
  'ALTER TABLE projects ADD COLUMN view_count INT NOT NULL DEFAULT 0 AFTER published_at'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = IF(
  EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'projects' AND column_name = 'favorite_count'
  ),
  'SELECT 1',
  'ALTER TABLE projects ADD COLUMN favorite_count INT NOT NULL DEFAULT 0 AFTER view_count'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = IF(
  EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'projects' AND column_name = 'like_count'
  ),
  'SELECT 1',
  'ALTER TABLE projects ADD COLUMN like_count INT NOT NULL DEFAULT 0 AFTER favorite_count'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS project_audit_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  project_id INT NOT NULL,
  action VARCHAR(20) NOT NULL,
  from_status VARCHAR(20) NOT NULL DEFAULT '',
  to_status VARCHAR(20) NOT NULL DEFAULT '',
  comment VARCHAR(255) NOT NULL DEFAULT '',
  operator_admin_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_project_audit_logs_project_id (project_id)
);

CREATE TABLE IF NOT EXISTS project_views (
  id INT PRIMARY KEY AUTO_INCREMENT,
  project_id INT NOT NULL,
  user_id INT NULL,
  visitor_key VARCHAR(64) NULL,
  ip VARCHAR(64) NULL,
  user_agent VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_project_views_project_id (project_id),
  KEY idx_project_views_user_id (user_id)
);

CREATE TABLE IF NOT EXISTS project_favorites (
  id INT PRIMARY KEY AUTO_INCREMENT,
  project_id INT NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_project_favorite (project_id, user_id),
  KEY idx_project_favorites_user_id (user_id)
);

CREATE TABLE IF NOT EXISTS project_likes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  project_id INT NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_project_like (project_id, user_id),
  KEY idx_project_likes_user_id (user_id)
);

SET @stmt = IF(
  EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'site_users' AND column_name = 'password'
  ),
  'SELECT 1',
  'ALTER TABLE site_users ADD COLUMN password VARCHAR(255) NOT NULL DEFAULT '''' AFTER phone'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = IF(
  EXISTS(
    SELECT 1 FROM information_schema.statistics
    WHERE table_schema = DATABASE() AND table_name = 'site_users' AND index_name = 'uniq_site_users_phone'
  ),
  'SELECT 1',
  'ALTER TABLE site_users ADD UNIQUE KEY uniq_site_users_phone (phone)'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  permission_group VARCHAR(50) NOT NULL,
  permission_group_name VARCHAR(50) NOT NULL,
  permission_code VARCHAR(80) NOT NULL UNIQUE,
  menu_id INT NULL
);

SET @stmt = IF(
  EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'permissions' AND column_name = 'menu_id'
  ),
  'SELECT 1',
  'ALTER TABLE permissions ADD COLUMN menu_id INT NULL AFTER permission_code'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS role_permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  UNIQUE KEY uniq_role_permission (role_id, permission_id),
  CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles (id),
  CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions (id)
);

CREATE TABLE IF NOT EXISTS menus (
  id INT PRIMARY KEY AUTO_INCREMENT,
  parent_id INT NULL,
  name VARCHAR(80) NOT NULL,
  path VARCHAR(120) NOT NULL DEFAULT '',
  component VARCHAR(120) NOT NULL DEFAULT '',
  permission_code VARCHAR(80) NOT NULL DEFAULT '',
  menu_key VARCHAR(120) NOT NULL UNIQUE,
  menu_type VARCHAR(20) NOT NULL DEFAULT 'menu',
  icon VARCHAR(50) NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT '启用',
  visible VARCHAR(20) NOT NULL DEFAULT '显示',
  sort_order INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_menus_parent FOREIGN KEY (parent_id) REFERENCES menus (id)
);

CREATE TABLE IF NOT EXISTS role_menus (
  id INT PRIMARY KEY AUTO_INCREMENT,
  role_id INT NOT NULL,
  menu_id INT NOT NULL,
  UNIQUE KEY uniq_role_menu (role_id, menu_id),
  CONSTRAINT fk_role_menus_role FOREIGN KEY (role_id) REFERENCES roles (id),
  CONSTRAINT fk_role_menus_menu FOREIGN KEY (menu_id) REFERENCES menus (id)
);

INSERT INTO project_categories (id, category_key, category_name, sort_order) VALUES
  (1, 'ai', 'AI 应用', 1),
  (2, 'ecommerce', '电商零售', 2),
  (3, 'tool', '效率工具', 3),
  (4, 'content', '内容社区', 4)
ON DUPLICATE KEY UPDATE category_name = VALUES(category_name), sort_order = VALUES(sort_order);

INSERT INTO projects (
  id, title, description, summary, content, category_id, cover_image, status, audit_status, audit_comment, published_at, sort_order
) VALUES
  (1, 'AI 商业计划生成器', '自动生成创业项目的商业计划书和财务预测。', '自动生成创业项目的商业计划书和财务预测。', '自动生成创业项目的商业计划书和财务预测。', 1, 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=900&q=80', 'published', 'approved', '', NOW(), 1),
  (2, '跨境选品雷达', '围绕跨境电商场景的趋势选品和竞品分析平台。', '围绕跨境电商场景的趋势选品和竞品分析平台。', '围绕跨境电商场景的趋势选品和竞品分析平台。', 2, 'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=900&q=80', 'published', 'approved', '', NOW(), 2),
  (3, '团队任务节奏板', '给团队做排期、看板和节奏回顾的轻量工具。', '给团队做排期、看板和节奏回顾的轻量工具。', '给团队做排期、看板和节奏回顾的轻量工具。', 3, 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80', 'published', 'approved', '', NOW(), 3),
  (4, '创作者选题池', '面向内容团队的选题整理、复盘和素材沉淀系统。', '面向内容团队的选题整理、复盘和素材沉淀系统。', '面向内容团队的选题整理、复盘和素材沉淀系统。', 4, 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=900&q=80', 'published', 'approved', '', NOW(), 4),
  (5, '智能客服知识台', '支持知识库检索、问答和工单协同的 AI 客服中心。', '支持知识库检索、问答和工单协同的 AI 客服中心。', '支持知识库检索、问答和工单协同的 AI 客服中心。', 1, 'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?auto=format&fit=crop&w=900&q=80', 'published', 'approved', '', NOW(), 5),
  (6, '私域活动排期器', '私域活动编排、投放和复盘的一体化工作台。', '私域活动编排、投放和复盘的一体化工作台。', '私域活动编排、投放和复盘的一体化工作台。', 3, 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=900&q=80', 'draft', 'pending', '', NULL, 6)
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  description = VALUES(description),
  summary = VALUES(summary),
  content = VALUES(content),
  category_id = VALUES(category_id),
  cover_image = VALUES(cover_image),
  status = VALUES(status),
  audit_status = VALUES(audit_status),
  audit_comment = VALUES(audit_comment),
  published_at = VALUES(published_at),
  sort_order = VALUES(sort_order);

INSERT INTO roles (id, name, scope) VALUES
  (1, '超级管理员', '全站配置与权限'),
  (2, '运营经理', '用户运营与内容管理'),
  (3, '客服专员', '网站用户处理与跟进')
ON DUPLICATE KEY UPDATE name = VALUES(name), scope = VALUES(scope);

INSERT INTO departments (id, parent_id, name, phone, email, status, sort_order) VALUES
  (1, NULL, '总经办', '13800000001', 'ceo@productideas.com', '启用', 1),
  (2, NULL, '产品研发中心', '13800000002', 'rd@productideas.com', '启用', 2),
  (3, 2, '前端组', '13800000021', 'fe@productideas.com', '启用', 1),
  (4, 2, '后端组', '13800000022', 'be@productideas.com', '启用', 2),
  (5, NULL, '运营增长部', '13800000003', 'growth@productideas.com', '启用', 3)
ON DUPLICATE KEY UPDATE
  parent_id = VALUES(parent_id),
  name = VALUES(name),
  phone = VALUES(phone),
  email = VALUES(email),
  status = VALUES(status),
  sort_order = VALUES(sort_order);

INSERT INTO admin_users (id, name, account, password, role_id, department_id, status) VALUES
  (1, '演示管理员', 'admin', 'scrypt$demo_admin$4f9504a23148b1019f191ac8f1dd54284a31fbe56ce487378f023233e212afd51992a9783906ea34083c1f1f1d4ada72774e836fdd835bee920d5cdb44e92e54', 1, 1, '启用'),
  (2, '演示运营', 'editor', 'scrypt$demo_editor$605cae03cea67b4891bb7e5b0fcef2c7c7789607ea4d2eb8f66a35f88996183260366b7562c1477b6f8cdf148b2faa0503c2790251abc5b63b0d3b4c7d83a9ba', 2, 5, '启用'),
  (3, '演示审核员', 'reviewer', 'scrypt$demo_reviewer$24c8027d8dbcb8ad5f90e2c237822b36bb72b39ee93658aa1bb85f3a27398f7a181d2eacfdc51021c3caa4f1f136dacd2ead452ccbeb373fe68e4c23615fe722', 3, 5, '停用')
ON DUPLICATE KEY UPDATE name = VALUES(name), account = VALUES(account), password = VALUES(password), role_id = VALUES(role_id), department_id = VALUES(department_id), status = VALUES(status);

INSERT INTO admin_user_roles (admin_user_id, role_id)
SELECT id, role_id
FROM admin_users
WHERE role_id IS NOT NULL
ON DUPLICATE KEY UPDATE role_id = VALUES(role_id);

INSERT INTO department_leaders (department_id, admin_user_id, is_primary, phone, email) VALUES
  (1, 1, 1, '13800000001', 'ceo@productideas.com'),
  (2, 1, 1, '13800000002', 'rd@productideas.com'),
  (5, 2, 1, '13800000003', 'growth@productideas.com')
ON DUPLICATE KEY UPDATE
  is_primary = VALUES(is_primary),
  phone = VALUES(phone),
  email = VALUES(email);

INSERT INTO site_users (id, nickname, phone, password, member_level, status) VALUES
  (101, '演示用户一', '13800000001', 'scrypt$demo_member_1$951d13f083d1fed4a1259a907af469366cbac8f91feeaca2d00649038267a74e89ace98c3eb7d8f85760dd4aa35e9ede754ef0de7248c29eef1ec7589c5dfe2e', '黄金会员', '正常'),
  (102, '演示用户二', '13800000002', 'scrypt$demo_member_2$91f3126b4580584286d69fc2887a6df4da3ffffb53ad6e2d5e1bfa6e14e1670537a00b1a589a2ff13ee63b029232e659df83bc234da0427c56823b42b7f2f893', '普通会员', '正常'),
  (103, '演示用户三', '13800000003', 'scrypt$demo_member_3$480a5126561862b830759b3679b08da81d3f6e0bbae1b871b122b4fa002e218d700c76b83b4526710eaebbbda3f1c5f95b69b4ee1a1bedb13c8b4427b9828163', '白金会员', '冻结')
ON DUPLICATE KEY UPDATE nickname = VALUES(nickname), phone = VALUES(phone), password = VALUES(password), member_level = VALUES(member_level), status = VALUES(status);

INSERT INTO dict_types (id, name, code, value_type, status, sort_order, remark) VALUES
  (1, '项目状态', 'project_status', '字符串', '启用', 1, '草稿、发布、归档'),
  (2, '用户来源', 'user_source', '字符串', '启用', 2, '支持平铺和渠道分层'),
  (3, '地区分类', 'region_tree', '字符串', '启用', 3, '省市区级联示例')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  code = VALUES(code),
  value_type = VALUES(value_type),
  status = VALUES(status),
  sort_order = VALUES(sort_order),
  remark = VALUES(remark);

INSERT INTO dict_items (id, dict_type_id, parent_id, label, value, status, sort_order, remark) VALUES
  (1, 1, NULL, '草稿', 'draft', '启用', 1, ''),
  (2, 1, NULL, '已发布', 'published', '启用', 2, ''),
  (3, 1, NULL, '已归档', 'archived', '启用', 3, ''),
  (4, 2, NULL, '站内注册', 'internal', '启用', 1, ''),
  (5, 2, NULL, '活动渠道', 'campaign', '启用', 2, ''),
  (6, 2, 5, '线下沙龙', 'campaign_salon', '启用', 1, ''),
  (7, 2, 5, '线上直播', 'campaign_live', '启用', 2, ''),
  (8, 2, NULL, '合作渠道', 'partner', '启用', 3, ''),
  (9, 2, 8, '服务商转介', 'partner_agency', '启用', 1, ''),
  (10, 2, 8, '生态推荐', 'partner_ecosystem', '启用', 2, ''),
  (11, 3, NULL, '浙江省', 'zhejiang', '启用', 1, ''),
  (12, 3, 11, '杭州市', 'hangzhou', '启用', 1, ''),
  (13, 3, 12, '西湖区', 'xihu', '启用', 1, ''),
  (14, 3, 12, '滨江区', 'binjiang', '启用', 2, ''),
  (15, 3, 11, '宁波市', 'ningbo', '启用', 2, ''),
  (16, 3, 15, '鄞州区', 'yinzhou', '启用', 1, '')
ON DUPLICATE KEY UPDATE
  dict_type_id = VALUES(dict_type_id),
  parent_id = VALUES(parent_id),
  label = VALUES(label),
  value = VALUES(value),
  status = VALUES(status),
  sort_order = VALUES(sort_order),
  remark = VALUES(remark);

INSERT INTO permissions (id, permission_group, permission_group_name, permission_code, menu_id) VALUES
  (1, 'system-user', '系统用户', 'system_user.view', 2),
  (2, 'system-user', '系统用户', 'system_user.create', 2),
  (3, 'system-user', '系统用户', 'system_user.edit', 2),
  (4, 'system-user', '系统用户', 'system_user.delete', 2),
  (5, 'role', '角色', 'role.view', 3),
  (6, 'role', '角色', 'role.create', 3),
  (7, 'role', '角色', 'role.edit', 3),
  (8, 'role', '角色', 'role.assign', 3),
  (9, 'site-user', '网站用户', 'site_user.view', 9),
  (10, 'site-user', '网站用户', 'site_user.freeze', 9),
  (11, 'site-user', '网站用户', 'site_user.tag', 9),
  (12, 'menu', '菜单管理', 'menu.view', 4),
  (13, 'menu', '菜单管理', 'menu.create', 4),
  (14, 'menu', '菜单管理', 'menu.edit', 4),
  (15, 'menu', '菜单管理', 'menu.delete', 4),
  (16, 'dict', '字典管理', 'dict.create', 7),
  (17, 'dict', '字典管理', 'dict.edit', 7),
  (18, 'dict', '字典管理', 'dict.delete', 7),
  (19, 'department', '部门管理', 'department.create', 5),
  (20, 'department', '部门管理', 'department.edit', 5),
  (21, 'department', '部门管理', 'department.delete', 5),
  (22, 'post', '岗位管理', 'post.create', 6),
  (23, 'post', '岗位管理', 'post.edit', 6),
  (24, 'post', '岗位管理', 'post.delete', 6),
  (25, 'project', '项目管理', 'project.view', 11),
  (26, 'project', '项目管理', 'project.create', 11),
  (27, 'project', '项目管理', 'project.edit', 11),
  (28, 'project', '项目管理', 'project.delete', 11),
  (29, 'project', '项目管理', 'project.publish', 11),
  (30, 'project', '项目管理', 'project.audit', 11),
  (31, 'role', '角色', 'role.delete', 3)
ON DUPLICATE KEY UPDATE permission_group = VALUES(permission_group), permission_group_name = VALUES(permission_group_name), permission_code = VALUES(permission_code), menu_id = VALUES(menu_id);

INSERT INTO role_permissions (role_id, permission_id) VALUES
  (1, 1), (1, 2), (1, 3), (1, 4),
  (1, 5), (1, 6), (1, 7), (1, 8), (1, 31),
  (1, 9), (1, 10), (1, 11),
  (1, 12), (1, 13), (1, 14), (1, 15),
  (1, 16), (1, 17), (1, 18),
  (1, 19), (1, 20), (1, 21),
  (1, 22), (1, 23), (1, 24),
  (1, 25), (1, 26), (1, 27), (1, 28), (1, 29), (1, 30),
  (2, 5), (2, 6), (2, 8),
  (2, 9), (2, 10), (2, 11),
  (2, 12), (2, 13), (2, 14), (2, 15),
  (2, 16), (2, 17), (2, 18),
  (2, 19), (2, 20), (2, 21),
  (2, 22), (2, 23), (2, 24),
  (2, 25), (2, 26), (2, 27), (2, 28), (2, 29), (2, 30),
  (3, 9), (3, 10)
ON DUPLICATE KEY UPDATE permission_id = VALUES(permission_id);

INSERT INTO menus (id, parent_id, name, path, component, permission_code, menu_key, menu_type, icon, status, visible, sort_order) VALUES
  (1, NULL, '系统管理', '/system', 'Layout', '', 'system-group', 'directory', 'LockOutlined', '启用', '显示', 1),
  (2, 1, '系统用户', '/system-users', 'system/user/index', 'system_user.view', '/system-users', 'menu', 'UserOutlined', '启用', '显示', 1),
  (3, 1, '角色管理', '/roles', 'system/role/index', 'role.view', '/roles', 'menu', 'TeamOutlined', '启用', '显示', 2),
  (4, 1, '菜单管理', '/menu-management', 'system/menu/index', 'permission.view', '/menu-management', 'menu', 'BarsOutlined', '启用', '显示', 3),
  (5, 1, '部门管理', '/departments', 'system/dept/index', 'system_user.view', '/departments', 'menu', 'ApartmentOutlined', '启用', '显示', 4),
  (6, 1, '岗位管理', '/posts', 'system/post/index', 'system_user.view', '/posts', 'menu', 'ProfileOutlined', '停用', '隐藏', 5),
  (7, 1, '字典管理', '/dict-management', 'system/dict/index', 'permission.view', '/dict-management', 'menu', 'BookOutlined', '启用', '显示', 6),
  (8, NULL, '用户中心', '/users', 'Layout', '', 'user-group', 'directory', 'UserSwitchOutlined', '启用', '显示', 2),
  (9, 8, '网站用户', '/site-users', 'user/site/index', 'site_user.view', '/site-users', 'menu', 'UserSwitchOutlined', '启用', '显示', 1),
  (10, NULL, '内容管理', '/content', 'Layout', '', 'content-group', 'directory', 'DatabaseOutlined', '启用', '显示', 3),
  (11, 10, '项目管理', '/projects', 'content/project/index', 'permission.view', '/projects', 'menu', 'DeploymentUnitOutlined', '启用', '显示', 1),
  (12, NULL, '工作台', '/dashboard', 'dashboard/index', '', '/dashboard', 'menu', 'HomeOutlined', '启用', '显示', 0)
ON DUPLICATE KEY UPDATE
  parent_id = VALUES(parent_id),
  name = VALUES(name),
  path = VALUES(path),
  component = VALUES(component),
  permission_code = VALUES(permission_code),
  menu_type = VALUES(menu_type),
  icon = VALUES(icon),
  status = VALUES(status),
  visible = VALUES(visible),
  sort_order = VALUES(sort_order);

INSERT INTO role_menus (role_id, menu_id) VALUES
  (1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7), (1, 8), (1, 9), (1, 10), (1, 11), (1, 12),
  (2, 3), (2, 4), (2, 7), (2, 8), (2, 9), (2, 10), (2, 11), (2, 12),
  (3, 8), (3, 9), (3, 12)
ON DUPLICATE KEY UPDATE menu_id = VALUES(menu_id);
