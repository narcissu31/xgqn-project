# Cloudflare Pages 部署说明

## 当前问题
Cloudflare Dashboard 中配置了 `npx wrangler deploy` 作为部署命令，但 Pages 项目不应该使用这个命令。

## 解决方案

### 方法1：修改现有项目的部署命令

1. 打开 https://dash.cloudflare.com
2. 点击左侧 **Workers & Pages**
3. 找到 **xgqn-project** 项目，点击进入
4. 点击顶部 **Settings** 标签
5. 在左侧菜单找 **Build & deployments** 或 **构建和部署**
6. 找到 **Deploy command** 字段
7. 删除 `npx wrangler deploy`，留空
8. 点击保存

### 方法2：重新创建项目

如果找不到设置，可以删除项目重新创建：

1. 在 Workers & Pages 页面，点击 **xgqn-project**
2. 点击 **Settings** → **General**
3. 滚动到底部，点击 **Delete project**
4. 确认删除（代码在 GitHub 上，不会丢失）
5. 回到 Workers & Pages 首页
6. 点击 **Create application**
7. 选择 **Pages** 标签
8. 点击 **Connect to Git**
9. 选择 GitHub 账号和 `xgqn-project` 仓库
10. 配置：
    - **Project name**: xgqn-project
    - **Production branch**: main
    - **Build command**: npm run build
    - **Build output directory**: .next
    - **Root directory**: / （默认）
11. 点击 **Save and Deploy**

## 重要提示

- 不要填写 Deploy command
- 不要勾选任何高级设置
- D1 数据库绑定可以在部署后在 Settings → Functions → D1 database bindings 中添加
