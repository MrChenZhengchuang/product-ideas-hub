# IdeaHub Mobile

IdeaHub 的 Taro 跨端客户端，使用 React + TypeScript 开发，当前支持 H5 和微信小程序构建。

## 已实现功能

- 项目列表、关键词搜索和分类筛选
- 项目详情、浏览数据、收藏和点赞
- 手机号注册、登录和图形验证码
- 项目投稿与审核状态展示
- 个人中心、我的发布和我的收藏
- 修改密码、趋势页和关于页
- H5 / 微信小程序共享业务代码与请求层

## 本地开发

建议在仓库根目录安装依赖并运行命令：

```bash
npm ci
npm run dev:mobile
```

微信小程序监听构建：

```bash
npm run dev:mobile:weapp
```

默认约定：

- H5 开发端口：`10086`
- H5 通过 `/api/client` 代理访问 `http://127.0.0.1:8080`
- 小程序开发环境直接访问 Java API
- 浏览器宽度不小于 769px 时，H5 默认跳转到 PC 端；追加 `?mobile=1` 可强制停留在移动版

## 生产构建

构建 H5：

```bash
npm run build:mobile
```

构建微信小程序，并指定线上 API：

```bash
CLIENT_API_ORIGIN=https://api.example.com npm run build:mobile:weapp
```

部署微信小程序前，还需要在微信公众平台配置合法请求域名，并确保 API 使用有效的 HTTPS 证书。

## 目录说明

```text
src/
├── features/       # 页面共享组件与壳层
├── pages/          # Taro 页面
├── services/       # Client API 和请求封装
├── utils/          # 跨页面工具
├── app.config.ts   # 页面与 TabBar 配置
└── app.tsx         # 应用入口
```

环境与代理配置位于 `config/`，业务接口集中在 `src/services/client-api.ts`。
