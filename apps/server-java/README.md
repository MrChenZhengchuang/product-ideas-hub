# product-ideas-server-java

与 `apps/server`（Node/Express）并行的 Java 后端，技术栈：**Spring Boot 3 + MyBatis + MySQL**。

- 默认端口：**8080**（Node 示例为 3001，互不冲突）
- 共用数据库：`product_ideas`
- 密码与 JWT 算法与 Node 对齐（`scrypt` + 自实现 HS256 JWT），可共用同一批用户数据

## 已实现接口（与 Node 对齐）

### 公共

| 方法 | 路径 |
|------|------|
| GET | `/health` |

### C 端 `/api/client`

| 方法 | 路径 | 鉴权 |
|------|------|------|
| GET | `/categories` | 公开 |
| GET | `/projects` | 公开 |
| GET | `/auth/captcha` | 公开 |
| POST | `/auth/register` | 公开 |
| POST | `/auth/login` | 公开 |
| GET | `/auth/current-user` | 登录 |
| POST | `/auth/change-password` | 登录 |
| GET | `/users/me/profile` | 登录 |
| GET | `/users/me/projects` | 登录 |
| GET | `/users/me/favorites` | 登录 |
| GET | `/projects/{id}` | 登录 |
| POST/DELETE | `/projects/{id}/favorite` | 登录 |
| POST/DELETE | `/projects/{id}/like` | 登录 |
| POST | `/projects` | 登录（投稿） |

### 管理端 `/api/admin`

| 模块 | 路径 |
|------|------|
| 认证 | `GET/POST /auth/captcha`、`/auth/login`、`/auth/logout`、`GET /current-admin` |
| 仪表盘 | `GET /dashboard` |
| 个人中心 | `GET/PUT /profile`、`POST /profile/change-password` |
| 界面偏好 | `GET/PUT /profile/preferences` |
| 设备会话 | `GET /profile/devices`、`DELETE /profile/devices/{id}` |
| 应用集成 | `GET /profile/integrations`、`POST/DELETE /profile/integrations/{id}/bind` |
| 系统用户 | `GET/POST /system-users`、`PUT/PATCH/DELETE /system-users/{id}` |
| 角色 | `GET/POST /roles`、`GET/PUT/PATCH/DELETE /roles/{id}`、`PUT /roles/{id}/permissions`、`PUT /roles/{id}/menus` |
| 字典 | CRUD `/dict-types`、CRUD `/dict-items`、`GET /dict-types/{id}/items` |
| 部门 | `GET/POST/PUT/DELETE /departments`、`GET /department-user-options` |
| 网站用户 | `GET/POST/PUT/PATCH/DELETE /site-users` |
| 权限 | `GET /permissions`、`GET /authorization-tree` |
| 菜单 | `GET/POST/PUT/DELETE /menus` |
| 项目 | `GET /project-categories`、`GET/POST/PUT/PATCH/DELETE /projects`、`POST /projects/{id}/audit` |

管理端写操作接口带 `@RequirePermission`，与 Node `requirePermission` 权限码一致；超级管理员自动放行。

## 环境要求

- **JDK 17+**
- MySQL（已执行 `apps/server/sql/schema.sql`）
- 项目自带 `./mvnw`（Maven Wrapper）

### macOS 安装 JDK

```bash
bash apps/server-java/scripts/install-java-macos.sh
source ~/.zshrc
java -version
```

## 配置

```bash
cp .env.example .env
```

## 本地运行

```bash
npm run dev:server-java
```

或：

```bash
cd apps/server-java
export $(grep -v '^#' .env | xargs)
./mvnw spring-boot:run
```

## 前端代理

| 应用 | 建议代理目标 |
|------|----------------|
| `apps/admin` | `http://127.0.0.1:8080` |
| `apps/client` | `http://127.0.0.1:8080` |
| 仍用 Node 时 | `http://127.0.0.1:3001` |

## 日志

访问日志（`access` logger）会输出请求方法、路径、状态、耗时及 **query/body 参数**（密码等敏感字段已脱敏）。

## 迁移说明

Node 路由仍保留在 `apps/server`，便于对照与回退。Java 已覆盖 `routes/admin.js` 与 `routes/client.js` 中的全部 HTTP 接口。
