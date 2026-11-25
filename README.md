# 小兔鲜儿 · 微信小程序版

## 资料说明

1. 视频学习：[https://www.bilibili.com/video/BV1Bp4y1379L/](https://www.bilibili.com/video/BV1Bp4y1379L/?share_source=copy_web&vd_source=2ac50d29193927b3c8597537dc4bc81d)
2. 接口文档：[说明 - 小兔鲜儿-小程序版](https://s.apifox.cn/0e6ee326-d646-41bd-9214-29dbf47648fa)
3. 在线笔记：[小兔鲜儿小程序 | uniapp+vue3+ts](https://youruilin.github.io/uni-app-shop-note/)

## 当前状态

- S0–S7 的页面与链路代码均已落地：首页、分类/二级分类/搜索、商品详情 + SKU、登录/个人中心/地址/收藏、购物车、结算/支付/订单/物流，共 **17 个页面**。
- **S8（分包与性能收尾）代码已完成**：17 页中 13 页已迁入 `packageGoods` 分包，主包只剩 4 个 tabBar 页；图片懒加载与购物车 `setData` 路径更新已落地。待重新上传体验版并做真机回归，任务书见 `idoc/stage-s8-subpackage-release.md`。
- 闸门答辩没有逐条留证据：`idoc/assignments.md` / `idoc/checklist.md` 的 ☑ 只表示**代码已落地**，不等于答辩或真机回归已通过。
- 已知受限项：搜索结果接口 `/search/all` 曾返回 500（代码走 error 态）；真实微信支付受 appid 白名单与 openid 限制，当前先试真实、失败降级模拟；头像上传受服务端 OSS 限制，成功路径未验证。

## 技术栈

| 项 | 选择 |
| --- | --- |
| 框架 | 微信小程序原生（无 Taro / uni-app） |
| 语言 | JavaScript（ES6+），JSDoc 标类型；未写 `.ts` 业务源码 |
| 样式 | SCSS（编译为 WXSS），单位 `rpx` |
| 渲染 | WebView 默认渲染（Skyline 已关闭） |
| UI | [TDesign Miniprogram](https://tdesign.tencent.com/miniprogram/overview) |
| 请求 | 自建 `utils/request.js`：统一头、token 注入、401 去重、abort、三态 |
| 导航 | 自定义 `navigation-bar`；页面统一 flex 骨架，头部不进滚动容器 |
| 分包 | 已启用：13 页在 `packageGoods`，4 个 tabBar 页在主包；`lazyCodeLoading: requiredComponents` |

## 目录结构

```
.
├── idoc/                     # 方案、S0~S7 阶段任务书、作业闸门、验收总表、接口参考
├── miniprogram/              # 小程序源码（miniprogramRoot）
│   ├── app.js / app.json / app.scss / sitemap.json
│   ├── global.scss           # 变量与 mixin；全局选择器在 app.scss
│   ├── package.json          # 依赖 + lint/format 脚本（构建 npm 只认这里）
│   ├── config/               # env.js（域名 + TEST_USER）、constants.js
│   ├── utils/                # request/auth/cart/collect/sku/area/address/common
│   ├── api/                  # 一域一文件：auth/cart/category/goods/home/member/order/pay/search
│   ├── components/           # navigation-bar / goods-card / sku-panel
│   ├── data/areas.js         # 生成的省市区数据（勿手改）
│   └── pages/                # 17 个页面，全部在主包
├── typings/ + tsconfig.json  # 为未来 TS 迁移保留；当前无 .ts 业务源码，不参与编译
├── project.config.json       # 开发者工具配置（AppID 是公开标识，不是密钥）
└── .vscode/settings.json     # 保存即格式化 + ESLint 自动修复
```

`package.json` 放在 `miniprogram/` 而不是仓库根目录：微信开发者工具只在 `miniprogramRoot` 内找 `node_modules` 来「构建 npm」。

## 快速开始

1. 安装依赖（Node ≥ 16，在 `miniprogram/` 下执行）：

   ```bash
   cd miniprogram
   npm install --registry=https://registry.npmmirror.com
   ```

   运行时依赖 3 个：`tdesign-miniprogram`、`lodash.debounce`、`tslib`（TDesign 编译产物依赖 tslib）；其余为 ESLint / Prettier 开发依赖。

2. 用微信开发者工具导入**项目根目录**（不是 `miniprogram/`），AppID 见 `project.config.json`。

3. 菜单 **工具 → 构建 npm**，生成 `miniprogram/miniprogram_npm/`。小程序不能直接读 `node_modules`，TDesign 必须构建后才能被 `usingComponents` 引用；改了 `package.json` 后要重跑。

4. 点「编译」。真机调试前需在小程序后台配置 request 合法域名；本地可在「详情 → 本地设置」勾选「不校验合法域名」。

### 代码检查

```bash
cd miniprogram
npm run lint         # ESLint 10 flat config，只查 JS
npm run lint:fix
npm run format       # Prettier（WXML 暂不格式化）
npm run format:check
```

## 接口与数据

- Apifox 文档：<https://s.apifox.cn/0e6ee326-d646-41bd-9214-29dbf47648fa>
- 接口字段与路径的唯一事实来源：`idoc/api-reference.md`（机器生成，勿手改）
- dev 域名：`https://pcapi-xiaotuxian-front-devtest.itheima.net`，只在 `miniprogram/config/env.js` 写一次；`release` 走 prod 域名。
- 公共头 `source-client: miniapp`；登录后带 `Authorization: <token>`；成功码是字符串 `"1"`（实测）。
- 测试账号在 `miniprogram/config/env.js` 的 `TEST_USER`，仅供学习联调；登录页还可通过微信一键登录。
- 本地收藏、未登录购物车用 Storage；支付在真实参数不可用时降级 `/pay/mock`。

## 合并前须知

- 仓库里出现的两个 `wx` 开头的 AppID 是**公开标识**（一个来自 Apifox 文档，一个来自 `project.config.json`），不是 AppSecret；仓库内没有 AppSecret 或 API Key。GitHub 密钥扫描若报「Tencent WeChat API App ID」，按误报关掉即可。
- S8 分包与性能优化代码已完成，但**未做重新上传后的包体确认与真机完整回归**；继续从 `idoc/stage-s8-subpackage-release.md` Step 5 开始。
- 页面骨架约定见 `idoc/02-architecture.md` §8：新页面必须是 `page` flex 纵列 + 头部分栏 + `scroll-view` 内容区，不要靠 sticky 解决头部固定。

## 文档索引

从 [`idoc/00-overview.md`](./idoc/00-overview.md) 开始：

| 文件 | 内容 |
| --- | --- |
| `idoc/00-overview.md` | 范围、协作方式、完成口径、页面清单 |
| `idoc/01-migration-map.md` | React → 小程序 概念/接口/组件/UI 对照 |
| `idoc/02-architecture.md` | 目录、分层、请求层契约、数据流、工程约定 |
| `idoc/03-roadmap.md` | 阶段依赖、接口映射、当前状态 |
| `idoc/api-reference.md` | Apifox 导出的接口参考（机器生成） |
| `idoc/assignments.md` | 阶段闸门与进度看板 |
| `idoc/checklist.md` | 验收总表、回归旅程、自评 |
| `idoc/stage-s0` ~ `stage-s8` | 各阶段任务书与复盘 |
| `idoc/notes/` | flex 布局 / scroll-view 调试笔记 |
