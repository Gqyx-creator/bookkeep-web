# 打工记账（CloudBase 静态版）

这是可直接部署到腾讯云 CloudBase 静态网站托管的原生 HTML + CSS + JavaScript 项目，无构建步骤、无服务器私钥。

## 文件结构

```text
cloudbase-ledger/
├── index.html                 # 登录页、账目列表、编辑弹窗
├── css/app.css                # 响应式手机/桌面样式
├── js/
│   ├── config.js              # 环境 ID、发布密钥、集合名（部署前唯一必配）
│   ├── cloudbase.js           # CloudBase Web SDK 初始化
│   ├── auth.js                # 邮箱密码、+86 短信验证码认证
│   ├── ledger.js              # 账目读取、仅新增/更新本人的记录
│   └── app.js                 # 页面交互、CSV 导出、未登录拦截
├── icons/                     # 由「记账icon.png」生成的 192px / 512px PWA 图标
├── manifest.json              # 手机“添加到主屏幕”配置
├── service-worker.js          # 离线缓存应用壳
├── cloudbaserc.json           # CloudBase CLI 静态托管配置
└── .gitignore
```

## 部署前必须完成的 CloudBase 配置

1. 打开环境 `qyx-weida-1-d7gzml5nu412d546c` 的 CloudBase 控制台。
2. 在 **身份认证** 中启用“邮箱密码”和“中国大陆手机号短信验证码”登录。邮箱注册还需要配置 SMTP；短信登录需要完成短信服务的签名、模板和资质配置。
3. 本项目先完成邮箱/短信真实用户登录，再用用户会话访问账目，因此前端无需配置 Publishable Key；绝不可写入服务端 API Key。如环境地域并非上海，在 `js/config.js` 修改 `region`。
   同时在 **环境配置 → 安全配置** 加入你的正式网站域名；本地调试时加入 `localhost:8080`。否则 Web SDK 会被安全来源/CORS 拦截。
4. 在 **云数据库** 中确认要沿用的集合名称；默认代码写为 `ledger_entries`。若你的旧集合有其他名称，只改 `js/config.js` 的 `collection` 值，不要新建、删除或改动旧集合。
5. 给该集合配置“仅创建者可读写”一类的按用户权限。不要使用“所有用户可读写”；前端的 `userId` 查询只是体验层筛选，数据库权限才是安全边界。

> 项目固定使用 CloudBase Web SDK `3.0.1`，避免 CDN `latest` 自动升级带来的认证行为变化。

> 认证方式和发布密钥必须在控制台启用后，网页的邮箱与短信登录按钮才会真正可用。请不要把 Secret Key 写进任何前端文件或 GitHub。

## 历史数据保护策略

原型已有字段保持不变：`id`、`role`、`date`、`start`、`end`、`amount`、`type`。

新写入的账目只额外带有：`userId`、`startDate`、`endDate`、`hasTime`、`hourlyRate`、`createdAt`、`updatedAt`、`schemaVersion`。代码没有集合迁移、`remove()`、批量覆盖或旧字段重命名。编辑时也仅更新当前登录用户点击的单条记录。

如果旧数据没有 `userId`，本版本会刻意不把它展示给任何新登录用户，避免历史记录被其他账号看到。要认领历史数据，请先备份数据库，再在受控的管理端/云函数中针对明确的 `_id` 一次性补充 `userId`；不要在浏览器中做无条件批量迁移。

## 本地预览

浏览器的 ES Module 与 Service Worker 不能可靠地从 `file://` 运行。可任选一个本地静态服务器：

```bash
cd cloudbase-ledger
python3 -m http.server 8080
```

访问 `http://localhost:8080`。本地预览前仍须填入真实 Publishable Key；否则会显示明确提示，不会误以为数据已保存。

## 上传 GitHub

在 `打工记账工具` 文件夹执行（首次 GitHub 推送前，请先在 GitHub 网页创建一个空仓库）：

```bash
git init
git add cloudbase-ledger
git commit -m "feat: add CloudBase ledger web app"
git branch -M main
git remote add origin https://github.com/你的用户名/你的仓库名.git
git push -u origin main
```

`config.js` 的 Publishable Key 可以公开，但如果你不希望它进入仓库，可把该文件加入 `.gitignore`，并在 CloudBase 的部署环境中手工填回；**Secret Key 永远不可上传**。

## 发布到腾讯云 CloudBase 静态托管

最简单的方式是在 CloudBase 控制台的 **静态网站托管** 上传 `cloudbase-ledger` 内的全部文件。上传后打开分配的默认域名测试登录、保存、刷新和 CSV 导出。

也可以安装 CloudBase CLI 后，在项目目录运行：

```bash
npm install -g @cloudbase/cli
cd cloudbase-ledger
tcb login
tcb hosting deploy . -e qyx-weida-1-d7gzml5nu412d546c
```

静态托管、GitHub 持续部署和自定义域名的设置，请以 CloudBase 官方文档为准：

- [静态网站托管介绍](https://docs.cloudbase.net/hosting/introduce)
- [快速开始](https://docs.cloudbase.net/hosting/quick-start)
- [Git 仓库持续部署](https://docs.cloudbase.net/hosting/web-hosting)
- [Web SDK 身份认证](https://docs.cloudbase.net/ai/cloudbase-ai-toolkit/prompts/auth-web-cloudbase)
