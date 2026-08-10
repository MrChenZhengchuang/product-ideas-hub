# Contributing

感谢你愿意参与 IdeaHub。

## 开始之前

1. Fork 仓库并从 `main` 创建功能分支。
2. 使用 Node.js 20/22、JDK 17+ 和 MySQL 8.x。
3. 不要提交 `.env`、数据库文件、上传内容或构建产物。

## 本地检查

```bash
npm ci
npm run build:web
npm run build:mobile
npm run test:java
```

Java 测试需要已经初始化的 MySQL；也可以先运行：

```bash
docker compose up -d mysql
```

## Pull Request

- 一个 PR 尽量只解决一个问题。
- 描述改动动机、验证方式和可能影响。
- 界面改动请附截图或录屏。
- 新功能请同步更新 README 或相关文档。

## 提交信息

推荐使用简洁的约定式前缀：

```text
feat: add project comments
fix: correct audit status filter
docs: improve Docker quick start
```
