# Publishing Guide

本文档说明如何发布 `@taskgenius/calendar` 包到 npm。

## 🔐 使用 Trusted Publishing（推荐）

本项目使用 npm 的 Trusted Publishing 功能，通过 GitHub Actions OIDC 进行身份验证，**无需管理 npm token**。

### 优势

- ✅ **更安全**：无需管理长期有效的 token
- ✅ **自动化**：推送 Tag 即可触发发布
- ✅ **可追溯**：自动生成 Provenance（包来源证明）
- ✅ **符合标准**：遵循 OpenSSF Trusted Publishers 规范

---

## 📋 发布前检查清单

在发布新版本之前，请确保：

- [ ] 所有测试通过（`npm test`）
- [ ] 代码已构建成功（`npm run build`）
- [ ] 类型检查通过（`npx tsc --noEmit`）
- [ ] CHANGELOG.md 已更新（如果有）
- [ ] README.md 或文档已更新（如适用）
- [ ] package.json 的版本号已更新

---

## 🚀 发布流程

### 方式 1：自动发布（推荐）⭐

通过创建 Git Tag 自动触发发布流程。

#### 步骤 1：更新版本号

使用 `npm version` 命令更新版本号（自动更新 package.json 并创建 commit）：

```bash
# 补丁版本（bug 修复）：0.1.0 -> 0.1.1
npm version patch

# 次版本（新功能，向后兼容）：0.1.0 -> 0.2.0
npm version minor

# 主版本（破坏性变更）：0.1.0 -> 1.0.0
npm version major
```

**或者手动修改 package.json：**

```json
{
  "version": "0.1.1"
}
```

然后提交：

```bash
git add package.json
git commit -m "chore: bump version to 0.1.1"
```

#### 步骤 2：创建并推送 Tag

```bash
# 创建 Tag（必须以 'v' 开头）
git tag v0.1.1

# 推送代码和 Tag
git push origin main
git push origin v0.1.1
```

**一键推送（推荐）：**

```bash
git push origin main --follow-tags
```

#### 步骤 3：自动发布

推送 Tag 后，GitHub Actions 会自动：

1. ✅ 运行类型检查
2. ✅ 运行构建
3. ✅ 运行测试
4. ✅ 发布到 npm（使用 OIDC，无需 token）
5. ✅ 生成 Provenance
6. ✅ 创建 GitHub Release

**查看进度：**

访问 https://github.com/taskgenius/calendar/actions

#### 步骤 4：验证发布

1. 检查 GitHub Actions 状态：https://github.com/taskgenius/calendar/actions
2. 检查 GitHub Release：https://github.com/taskgenius/calendar/releases
3. 检查 npm 包页面：https://www.npmjs.com/package/@taskgenius/calendar
4. 测试安装：

```bash
npm install @taskgenius/calendar@latest
```

---

### 方式 2：手动发布

在紧急情况下，可以通过 GitHub Actions 界面手动触发发布。

#### 步骤 1：更新版本号

手动编辑 `package.json`：

```json
{
  "version": "0.1.2"
}
```

提交并推送：

```bash
git add package.json
git commit -m "chore: bump version to 0.1.2"
git push origin main
```

#### 步骤 2：触发手动发布

1. 访问 https://github.com/taskgenius/calendar/actions/workflows/manual-publish.yml
2. 点击 "Run workflow"
3. 选择分支（通常是 `main`）
4. 输入版本号（如 `0.1.2`）
5. 选择是否创建 GitHub Release
6. 点击 "Run workflow"

#### 步骤 3：验证发布

同方式 1 的步骤 4。

---

## 📌 版本号规范

本项目遵循 [语义化版本 2.0.0](https://semver.org/lang/zh-CN/)：

```
主版本号.次版本号.修订号
```

- **主版本号（Major）**：不兼容的 API 修改
- **次版本号（Minor）**：向后兼容的功能性新增
- **修订号（Patch）**：向后兼容的问题修正

### 示例

| 版本 | 类型 | 说明 |
|------|------|------|
| 0.1.0 → 0.1.1 | Patch | 修复 bug |
| 0.1.1 → 0.2.0 | Minor | 添加新功能 |
| 0.2.0 → 1.0.0 | Major | 破坏性变更 |

---

## 🔧 Trusted Publishing 配置

### 首次配置（已完成）✅

1. **首次手动发布**
   ```bash
   npm login
   npm publish --access public
   ```

2. **在 npm 网站配置 Trusted Publisher**
   - 访问：https://www.npmjs.com/package/@taskgenius/calendar/access
   - 点击 "Trusted Publisher" → "GitHub Actions"
   - 配置：
     - Organization or user: `taskgenius`
     - Repository: `calendar`
     - Workflow filename: `publish.yml`
   - 保存

3. **（推荐）限制 Token 访问**
   - Settings → Publishing access
   - 选择 "Require two-factor authentication and disallow tokens"

### 验证配置

检查 Trusted Publisher 是否正确配置：

1. 访问包设置页面
2. 查看 "Trusted Publisher" 部分
3. 确认显示：
   - Provider: GitHub Actions
   - Repository: taskgenius/calendar
   - Workflow: publish.yml

---

## ❓ 常见问题

### Q1: 发布失败，提示 "Unable to authenticate"

**原因：** Trusted Publisher 配置不匹配。

**解决方案：**
1. 检查 npm 网站的配置是否正确
2. 确认 workflow 文件名是 `publish.yml`（包含 `.yml` 后缀）
3. 确认文件名大小写完全匹配
4. 查看 GitHub Actions 日志获取详细错误信息

### Q2: 如何回滚版本？

npm 不支持删除已发布的版本，但可以发布新版本：

```bash
# 弃用某个版本
npm deprecate @taskgenius/calendar@0.1.1 "This version has critical bugs. Please use 0.1.2"

# 发布修复版本
npm version patch
git push origin main --follow-tags
```

### Q3: 如何发布 beta 版本？

```bash
# 更新版本号
npm version prerelease --preid=beta
# 例如：0.1.0 -> 0.1.1-beta.0

# 创建并推送 Tag
git tag v0.1.1-beta.0
git push origin main --follow-tags
```

Beta 版本会正常发布，用户需要明确指定版本安装：

```bash
npm install @taskgenius/calendar@0.1.1-beta.0
```

### Q4: Provenance 是什么？

Provenance（来源证明）是一个加密签名的证明文件，包含：

- 包的构建环境信息
- 源代码仓库位置
- 构建工作流详情
- 时间戳

用户可以验证包的真实来源，防止供应链攻击。

查看 Provenance：访问 npm 包页面，会看到 "Provenance" 徽章。

### Q5: 可以在本地发布吗？

不推荐。使用 Trusted Publishing 后，应通过 GitHub Actions 发布以获得：

- ✅ 自动化测试和构建
- ✅ Provenance 生成
- ✅ 审计追踪
- ✅ 统一的发布流程

如果确实需要本地发布：

```bash
npm login
npm run build
npm test
npm publish
```

**注意：** 本地发布不会生成 Provenance。

---

## 📚 相关资源

- [npm Trusted Publishing 文档](https://docs.npmjs.com/generating-provenance-statements#using-trusted-publishing)
- [语义化版本规范](https://semver.org/lang/zh-CN/)
- [GitHub Actions OIDC 文档](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
- [OpenSSF Trusted Publishers](https://repos.openssf.org/trusted-publishers)

---

## 🆘 需要帮助？

如果遇到问题：

1. 查看 GitHub Actions 运行日志
2. 查看本文档的"常见问题"部分
3. 在 GitHub Issues 中提问：https://github.com/taskgenius/calendar/issues

---

**最后更新：** 2025-11-20
