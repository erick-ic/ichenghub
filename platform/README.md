# Platform 配置

## Gitee 登录

在 Gitee OAuth 应用中配置 `user_info`、`emails` 授权范围，并将以下凭据加入本地 `platform/.env` 或服务器的 `.env`：

```dotenv
AUTH_GITEE_ID=your-gitee-client-id
AUTH_GITEE_SECRET=your-gitee-client-secret
```

应用回调地址须与访问站点的地址一致：

- 本地开发：`http://localhost:3000/api/auth/callback/gitee`
- 当前生产站点：`https://ichenghub.cn/api/auth/callback/gitee`

回调路径不包含 `/zh` 或 `/en`。本地和生产环境分别使用与其回调地址匹配的 OAuth 应用及凭据。

按 `deploy.sh` 的部署流程，将服务器 `.env` 同步到 `.next/standalone/.env`，并重新加载应用使配置生效。真实凭据不应写入版本库。

邮箱只从 Gitee 邮箱列表中读取，要求 `state` 为 `confirmed`，优先使用已确认的主邮箱。没有符合条件的记录、邮箱接口返回非成功状态或返回非数组数据时，邮箱保留为 `null`；不会使用公开资料中的邮箱作为兜底，也不会按邮箱自动合并账号。
