# 小兔鲜儿 · 微信小程序版

用微信小程序**原生框架**重做的小兔鲜儿商城，与已完成的 React 版（`F:/Web/react-rabbit`）同一套业务，作为学习项目推进。

## 技术栈

| 项 | 选择 |
| --- | --- |
| 框架 | 微信小程序原生（无 Taro / uni-app） |
| 语言 | JavaScript（ES6+），用 JSDoc 标类型，保留 TS 迁移能力 |
| 样式 | SCSS（编译为 WXSS），单位 `rpx` |
| 渲染 | WebView 默认渲染（未启用 Skyline） |
| UI | [TDesign Miniprogram](https://tdesign.tencent.com/miniprogram/overview) |
| 请求 | 自建 `utils/request.js`（未开始，见阶段 S1） |

## 目录

```
miniprogram/
├─ app.js / app.json / app.scss
├─ global.scss        # SCSS 全局变量与 mixin（自动注入每个 scss）
├─ package.json       # 依赖清单（放在 miniprogramRoot 内，构建 npm 才找得到）
├─ pages/             # 主包：4 个 tabBar 页
└─ components/        # 跨页复用组件
idoc/                 # 方案、阶段任务书、作业看板、验收总表
```

> `package.json` 与 `node_modules` 刻意放在 `miniprogram/`（即 `miniprogramRoot`）里面，因为开发者工具默认只在该目录下寻找 `node_modules` 来「构建 npm」。

## 快速开始

1. 安装依赖（**在 `miniprogram/` 目录下执行**）：

   ```bash
   cd miniprogram
   npm install --registry=https://registry.npmmirror.com
   ```

   依赖只有两个：`tdesign-miniprogram` 与 `tslib`（TDesign 编译产物里 `import ... from "tslib"`，必须单独装）。

2. 用**微信开发者工具**导入本项目根目录（AppID 见 `project.config.json`）。

3. 菜单 **工具 → 构建 npm**。成功后会出现 `miniprogram/miniprogram_npm/`。

   > 小程序不能直接读 `node_modules`，必须构建后才能 `usingComponents` 引用 TDesign。

4. 点「编译」，首页应显示占位文案与一个 TDesign 按钮。

> 改了 `package.json` 依赖后，必须重新执行一次「构建 npm」。

## 接口

- 文档：https://s.apifox.cn/0e6ee326-d646-41bd-9214-29dbf47648fa
- dev 域名：`https://pcapi-xiaotuxian-front-devtest.itheima.net`
- 必带请求头：`source-client: miniapp`
- 鉴权：`Authorization: <token>`，无效返回 401

真机调试前需在小程序后台配置 request 合法域名；开发者工具可在「详情 → 本地设置」勾选「不校验合法域名」。

## 文档

从 [`idoc/00-overview.md`](./idoc/00-overview.md) 开始读：

| 文件 | 内容 |
| --- | --- |
| `idoc/00-overview.md` | 范围、协作方式、完成口径、页面清单 |
| `idoc/01-migration-map.md` | React → 小程序 概念/接口/组件/UI 对照 |
| `idoc/02-architecture.md` | 目录、分层、请求层契约、数据流、规范 |
| `idoc/03-roadmap.md` | 9 个阶段、工时、44 个接口映射 |
| `idoc/assignments.md` | 阶段闸门与进度看板 |
| `idoc/checklist.md` | 验收总表、回归旅程、自评 |
| `idoc/stage-sX-*.md` | 各阶段任务书 |

## 进度

- [x] S0-1 关闭 Skyline、TS → JS、清模板与空目录
- [x] S0-2 TDesign 安装（待手动「构建 npm」验证）
- [ ] S0-3 样式体系验证
- [ ] S0-4 tabBar 四页
