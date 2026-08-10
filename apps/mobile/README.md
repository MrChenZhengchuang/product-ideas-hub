# Mobile App Scaffold

这个目录是新的跨端前台落点，目标顺序是：

1. 先交付 H5
2. 再编译微信小程序
3. 业务稳定后再评估 App 方案

当前骨架包含：

- Taro + React + TypeScript 基础配置
- H5 / 微信小程序双脚本
- 对应现有前台页面的路由占位页
- 统一的跨端请求层起点 `src/services/http.ts`

## 建议迁移顺序

1. `HomePage` -> `pages/home`
2. `ProjectDetailPage` -> `pages/project-detail`
3. `AuthPage` -> `pages/auth`
4. `PublishPage` -> `pages/publish`
5. `MePage` + `ChangePasswordPage` -> `pages/me` / `pages/change-password`
6. `TrendsPage` / `AboutPage`

## 本地命令

```bash
npm install
npm run dev:mobile
npm run dev:mobile:weapp
```

默认约定：

- H5 开发端口：`10086`
- H5 请求代理：`http://127.0.0.1:8080`（Java 服务）
- 小程序开发时默认直接请求：`http://127.0.0.1:8080/api/client`

后面上线小程序时，需要把 `config/prod.ts` 里的 `CLIENT_API_ORIGIN` 改成正式 Java API 域名，并完成小程序合法域名配置。

H5 在浏览器宽度 ≥ 769px 时会自动跳转到 PC 官网（`CLIENT_WEB_ORIGIN`）。若需强制使用手机版，在地址后加 `?mobile=1`。
