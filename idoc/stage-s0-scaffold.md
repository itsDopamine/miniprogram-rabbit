# 阶段 S0 · 配置迁移与工程骨架（零基础详细操作版）

> 状态：**进行中** —— Step 1 ~ Step 7 已完成，剩 Step 8 提交 + 闸门答辩
> 工时：1.5 天 · 开工：2026-11-24
> 前置条件：微信开发者工具可打开本项目；Node ≥ 16

---

## 1. 学习目标

学完这一阶段，你要能回答：

- 小程序为什么「不能操作 DOM」？`setData` 到底做了什么？
- WebView 渲染和 Skyline 渲染的根本差别是什么？市面上到底谁在用？
- 一个页面由哪四个文件组成？为什么 `app.json` 里的路径不带后缀？
- `useCompilerPlugins` 是什么？为什么关掉 TypeScript 后必须把 `.ts` 删干净？
- 小程序为什么要「构建 npm」？`miniprogram_npm` 为什么不能提交到仓库？

产出一个「干净、可长期开发」的骨架，不写任何业务代码。

---

## 2. 前置知识速成（约 30 分钟，别跳过）

### 2.1 你已有的知识可以直接复用的部分

| 你已经会 | 小程序里怎么用 |
| --- | --- |
| ES6 模块、解构、模板字符串 | 完全一样 |
| Promise / async-await | 完全一样（`wx.request` 只是回调式，封装后即 Promise） |
| SCSS 嵌套与变量 | 一样，只是编译产物叫 WXSS |
| 组件化思想 | 概念一样，API 不同（`properties` 代替 props） |

**不复用的**：JSX、React 生命周期、Redux、React Router、DOM API。这些在小程序里都没有对应物，别去找。

### 2.2 必须先懂的 5 件事

**① 双线程模型**

```
逻辑层（JS 引擎：iOS = JavaScriptCore，Android = V8）
   │  你的 .js：Page({ data })、事件处理、wx.request
   │        ↑↓  唯一通道 setData()，数据序列化后跨线程传递
渲染层（WebView）：WXML + WXSS 编译成 HTML/CSS，把 data 画出来
```

三条推论：
- `setData` 是**跨线程通信**，不是变量赋值——这就是性能优化的总开关；
- 逻辑层**拿不到 DOM**，改界面只能改 `data`；
- `setData` 是异步的，想读渲染结果得用回调或 `wx.createSelectorQuery()`。

**② 一个页面 = 四件套**

| 文件 | 作用 |
| --- | --- |
| `.js` | 逻辑：`Page({ data, 生命周期, 事件处理 })` |
| `.json` | 页面配置：`usingComponents`、下拉刷新等 |
| `.wxml` | 结构：标签 + `{{}}` 数据绑定 |
| `.scss` | 样式：单位用 `rpx` |

页面还必须在 `app.json` 的 `pages` 数组里注册，**路径不带后缀**（`pages/index/index`）。

**③ 渲染引擎的两代**

| | WebView（旧，默认） | Skyline（新，2022 起 / 基础库 3.0+） |
| --- | --- | --- |
| 原理 | 每页一个 WebView，WXML→HTML | 自绘渲染，不用 WebView |
| 组件框架 | exparser | **必须**配 glass-easel |
| 优势 | 兼容好、生态全、可调 DOM | 帧率高、内存低、支持手势与 worklet |
| 劣势 | 长列表/动画易掉帧 | 组件库基本未适配，不支持 `web-view` 与部分 CSS |
| 谁在用 | **绝大多数项目**，TDesign / Vant 都基于它 | 官方自家产品与性能敏感场景 |

> 模板默认开了 Skyline，但它**不是**我们的选择。理由：零基础需要可搜索的环境；TDesign 基于 WebView；本项目瓶颈在接口与图片，不在帧率。

**④ `useCompilerPlugins` 是什么**

`project.config.json` 里的编译器插件开关，决定开发者工具把什么源码转成小程序能跑的产物：

- `"typescript"`：`.ts` → `.js`
- `"sass"`：`.scss` → `.wxss`，**并负责把 `global.scss` 注入每个 scss 文件**

关掉 `typescript` 后，`.ts` 文件不再被编译，所以必须删干净，否则会残留「看不见但存在」的文件。

**⑤ 为什么要「构建 npm」**

小程序真机没有 Node 的模块解析，`require('tdesign-miniprogram/button')` 在真机上找不到 `node_modules`。所以工具提供「构建 npm」：把用到的包按小程序规则改写并拷贝到 `miniprogram/miniprogram_npm/`，页面才 import 得到。

因为它是**派生产物**，所以进 `.gitignore`，由 `package.json` + 一次构建命令复现。

---

## 3. Step 0：环境检查（5 分钟）

1. 开发者工具能正常打开本项目，模拟器出界面。
2. 终端确认 Node：
   ```
   node -v
   npm -v
   ```
3. 记住两个菜单：**工具 → 构建 npm**、**工具 → 清除缓存 → 全部清除**。

---

## 4. 分步实现

### Step 1：关闭 Skyline（两处，缺一不可）✅ 已完成

`project.config.json`：

```diff
  "useCompilerPlugins": [
-   "typescript",
    "sass"
  ],
- "skylineRenderEnable": true,
+ "skylineRenderEnable": false,
```

`app.json`：删掉整段 `rendererOptions` 和 `componentFramework: "glass-easel"`，保留 `"style": "v2"`。

> 为什么改两处：`project.config.json` 管「工具是否启用 Skyline」，`app.json` 管「页面用什么渲染」。只关一个会出现「改了没生效」的假象。

### Step 2：TS → JS（只去类型，不改逻辑）✅ 已完成

| 原文件 | 现文件 | 去掉的标注 |
| --- | --- | --- |
| `app.ts` | `app.js` | `App<IAppOption>({` → `App({` |
| `pages/index/index.ts` | `pages/index/index.js` | `getApp<IAppOption>()`、`(e: any)` ×2 |
| `pages/logs/logs.ts` | 已删除 | — |
| `components/navigation-bar/navigation-bar.ts` | `navigation-bar.js` | `_showChange(show: boolean)` |
| `utils/util.ts` | `utils/util.js` | `(date: Date)`、`(n: number)` |

顺带把 `navigation-bar.js` 里废弃的 `wx.getSystemInfo` 换成 `wx.getWindowInfo()` + `wx.getDeviceInfo()`。

### Step 3：清理模板残留 ✅ 已完成

| 处理 | 原因 |
| --- | --- |
| 删除 `pages/logs/` 并从 `app.json` 的 `pages` 移除 | quickstart 演示页，只打印启动日志 |
| `pages/index/*` 重写为占位页 | 原页是「获取头像昵称」演示，`wx.getUserProfile` 已废弃，S2 整页重写 |
| 删除空目录 `mock/`、`packageGoods/`、`components/goods-item`、`page-status`、`price` | git 不跟踪空目录，用时随代码创建 |
| 保留 `components/navigation-bar/` | 自定义导航栏要用 |
| 保留 `typings/`、`tsconfig.json` | 编辑器提示 + 未来迁 TS 的地基，不参与编译 |
| 保留 `utils/util.js` 的 `formatTime` | S7 订单时间展示要用 |

### Step 4：建 `global.scss` 与全局重置 ✅ 已完成

`miniprogram/global.scss`（**靠各 scss 文件显式 `@import` 引入**，不依赖任何工具注入配置，理由见 Step 6）：

- 只放**变量**和 **mixin**，**绝不写选择器**——否则每个 scss 编译都重复输出一遍，体积成倍增长；
- 当前内容：品牌色 `$brand-color`、文字色、背景/边框、字号 `$font-xs ~ $font-xl`、间距、圆角，以及 `ellipsis` / `ellipsis-multi` / `hairline` 三个 mixin。

`app.scss`：

- 给常用标签加 `box-sizing: border-box`（WebView 默认 `content-box`，`width:100%` 加内边距会溢出）；
- 设 `page` 的底色、基础字号、字体族。

> 注意：`app.scss` 与 `index.scss` 里**故意还没用变量**。先保证编译通过，变量引入方式放在 Step 6 单独处理。

### Step 5：构建 npm + TDesign 冒烟（你来做，约 15 分钟）

**已完成的准备**：`tdesign-miniprogram@1.18.0` 已写入 `package.json` 并装进 `node_modules`；首页 `index.json` 已声明 `t-button`；`index.wxml` 里已放了一个测试按钮。

**关键前提（已处理，必须理解）**：本项目的 `miniprogramRoot` 是 `miniprogram/`。开发者工具「构建 npm」**只会在 `miniprogramRoot` 目录里找 `node_modules`**，放在项目根目录它看不见，而且失败是**静默的**——表现就是编译时报「路径下未找到组件」，但 `miniprogram_npm` 根本不生成。

所以依赖清单和依赖都搬进了 `miniprogram/`：

```
miniprogram/
├─ package.json          # 依赖清单
└─ node_modules/         # 构建 npm 的输入（已 gitignore）
```

依赖只有两个：

| 包 | 为什么需要 |
| --- | --- |
| `tdesign-miniprogram` | 组件库本体，`package.json` 里 `"miniprogram": "miniprogram_dist"` 决定构建入口 |
| `tslib` | **TDesign 的编译产物里 106 个文件写着 `import ... from "tslib"`，但它自己没有声明这个依赖**，不单独装就会在构建/编译阶段报「模块 tslib 未找到」 |

> 另有一条路：保持根目录 `package.json`，用 `packNpmManually: true` + `packNpmRelationList` 指定根目录清单与输出目录。本项目一开始试过，工具没认，改回「依赖放 `miniprogramRoot` 内」这条更稳的默认路径。

**兜底方案（本项目实际采用）**：当「构建 npm」菜单执行后 `miniprogram_npm/` 仍不生成时，可以手工生成等价产物——构建 npm 本质就是「把包的 `miniprogram` 字段指向的目录拷到 `miniprogram_npm/<包名>/`」：

```
miniprogram/miniprogram_npm/tdesign-miniprogram/   ← 复制 node_modules/tdesign-miniprogram/miniprogram_dist/*
miniprogram/miniprogram_npm/tslib/index.js         ← 复制 node_modules/tslib/tslib.js 并改名为 index.js
```

为什么 `tslib` 要改名 `index.js`：`import ... from "tslib"` 编译成 `require("tslib")` 后，工具按目录名解析，需要该目录下有 `index.js` 作为入口。

> 这是**绕路**，不是正解：`miniprogram_npm/` 已被 gitignore，将来工具能正常构建时会被覆盖。学习目标仍是理解「构建 npm 到底做了什么」。

**你要做的**：

1. 菜单 **工具 → 构建 npm**，等提示「构建完成」。
2. 确认项目里出现 `miniprogram/miniprogram_npm/tdesign-miniprogram/`。
3. 点「编译」，首页应出现一个蓝色大按钮「TDesign 就绪」，点击弹出 toast。
4. 截图存 `idoc/tmp/s0-tdesign.png`。

**验证原理**：`tdesign-miniprogram` 的 `package.json` 里有 `"miniprogram": "miniprogram_dist"` 字段，构建时工具以它为入口，所以 `usingComponents` 里写的是 `tdesign-miniprogram/button/button`，而不是带 `miniprogram_dist`。

### Step 6：SCSS 变量的引入方式（已定方案）

**结论：不用工具的「自动注入」，改用显式 `@import`。**

- **来源核查**：`sassSetting.sassCommonUseFilePath` / `scssCommonUseFilePath` 只出现在开发者工具生成的模板 `project.config.json` 里（可验证：`git show 353151a:project.config.json`），**官方「项目配置文件」文档的 `setting` 字段表中没有这两个字段**。它属于「工具写入、未文档化」的配置。
- **实测结论**：本机工具版本下写了 `$brand-color` 仍编译报 `Error: Undefined variable`，说明该配置未生效。
- **处理**：整块删除 `sassSetting`，统一用显式 `@import`。它不依赖任何工具私有配置，任何工具链都成立；并且 `global.scss` 里没有选择器，重复 import 不会产生重复 CSS。
- 依据分级与全部配置的溯源见 [`02-architecture.md`](./02-architecture.md) §9。

各层级的引入路径：

| 文件位置 | 写法 |
| --- | --- |
| `pages/xxx/xxx.scss` | `@import '../../global.scss';` |
| `components/xxx/xxx.scss` | `@import '../../global.scss';` |
| `packageGoods/pages/xxx/xxx.scss` | `@import '../../../global.scss';` |

**验收方式**：改 `global.scss` 里的 `$brand-color`，全站用到该变量的地方一起变色。

### Step 7：配 tabBar 四个页面 ✅ 已完成

> 说明：这一步是纯样板（12 个文件只有占位文案），已由 AI 代写。**S2 起的页面逻辑全部由你自己写**，这里不构成「代写业务」。

1. 已建 `pages/category/`、`pages/cart/`、`pages/member/` 三个页面，每个四件套齐全，`.scss` 顶部都带 `@import '../../global.scss';`。
2. `app.json` 的 `pages` 加入另外三个；新增 `tabBar`：

```json
"tabBar": {
  "color": "#999999",
  "selectedColor": "#cf4444",
  "backgroundColor": "#ffffff",
  "borderStyle": "black",
  "list": [
    { "pagePath": "pages/index/index",        "text": "首页" },
    { "pagePath": "pages/category/category",  "text": "分类" },
    { "pagePath": "pages/cart/cart",          "text": "购物车" },
    { "pagePath": "pages/member/member",      "text": "我的" }
  ]
}
```

3. **先不配图标**：`iconPath` / `selectedIconPath` 都是可选字段，不写就只显示文字。图标涉及 8 张 81×81 png 的素材准备，放到 S2 做视觉还原时一起补，不要卡在这里。
4. 注意：页面文件名要与 `pagePath` 完全对应（`pages/cart/cart` 指 `pages/cart/cart.js|json|wxml|scss`）。若按 `index` 命名，则写 `pages/cart/index`。
5. 建 `api/`、`config/` 两个目录（先各放一个 `.gitkeep`，否则 git 不跟踪空目录）。

### Step 8：提交（5 分钟）

```
git add -A
git commit -m "feat(S0): 关闭 Skyline、迁移 JS、接入 TDesign、配置 tabBar"
```

---

## 5. 验收（逐条自测，勾完再进 S1）

- [ ] `project.config.json`：`useCompilerPlugins` 仅 `["sass"]`，`skylineRenderEnable: false`
- [ ] `app.json` 搜不到 `skyline`、`glass-easel`
- [ ] 工程内无 `.ts` 页面/组件/工具文件（`typings/` 除外）
- [ ] `miniprogram_npm/tdesign-miniprogram/` 存在，首页 TDesign 按钮可点
- [ ] 改 `$brand-color` 全站标题变色（变量注入生效）
- [ ] tabBar 四页可互跳，选中态颜色正确
- [ ] `api/`、`config/` 目录已建
- [ ] 控制台无报错

---

## 6. 报错急救表

| 报错 / 现象 | 原因 | 处理 |
| --- | --- | --- |
| 报错形如 `["usingComponents"]["t-button"]: "tdesign-miniprogram/button/button" 路径下未找到组件` | **`miniprogram_npm` 根本没生成**，即「构建 npm」没成功 | ① 确认 `miniprogram/package.json` 与 `miniprogram/node_modules` 都存在；② 工具 → 构建 npm；③ 确认 `miniprogram/miniprogram_npm/` 出现后再编译 |
| 构建 npm 报「模块 tslib 未找到」 | TDesign 产物 `import "tslib"` 但未声明该依赖 | `cd miniprogram && npm i tslib`，再重新构建 |
| 控制台 `Unexpected token 'export'` + `module 'app.js' is not defined` | `project.config.json` 里 `"es6": false`，ES6 模块没被转译，`export` 被当普通脚本执行 | 改 `"es6": true`、`"enhance": true`，重启工具后重编译 |
| `未找到 t-button` / 组件找不到 | 构建过但没重新编译，或产物路径不对 | 重新编译；检查 `miniprogram_npm/tdesign-miniprogram/button/` 是否存在 |
| 构建 npm 报「没有找到 node_modules」 | 依赖没装，或 `package.json` 不在项目根目录 | 项目根目录执行 `npm install` |
| 页面白屏，`app.json` 解析失败 | JSON 尾随逗号 | 删掉多余的逗号 |
| 报「未找到页面 pages/xxx」 | `pages` 里注册了但文件不存在，或路径与文件名不一致 | 对齐目录与 `pagePath` |
| `Error: Undefined variable`（WXSS 编译错误） | 该 scss 文件里用了 `$变量` 但没有引入 `global.scss`；工具的 `scssCommonUseFilePath` 在本机不生效 | 在文件顶部加 `@import '../../global.scss';`（分包页是 `../../../`） |
| 样式全乱、宽度溢出 | 盒模型仍是 `content-box` | 确认 `app.scss` 的 `box-sizing` 重置生效 |
| tabBar 图标不显示 | 用了网络图，或不是本地 png，或尺寸过大 | 本地 81×81 png |
| 改了变量没变化 | 工具缓存 | 工具 → 清除缓存 → 全部清除 |

---

## 7. 阶段作业（不完成不准进入 S1）

| # | 作业 | 提交物 |
| --- | --- | --- |
| 0-1 | 两处 Skyline 开关关闭 + `ts→js` 迁移 | `git diff` 摘要 |
| 0-2 | 构建 npm + TDesign 按钮冒烟 | `idoc/tmp/s0-tdesign.png` |
| 0-3 | 变量注入验证 | 一句结论：改色后是否全局生效 |
| 0-4 | tabBar 四页 + `api/`、`config/` 目录 | 截图 |

### 闸门答辩（答不出就不算通过）

1. `setData` 为什么不能像 React 的 `setState` 那样理解？它的开销从哪来？
2. 为什么关 Skyline 要改两个文件？只改一个会怎样？
3. 「构建 npm」到底做了什么？为什么 `miniprogram_npm` 不提交到 git？

---

## 8. 完成标志（M0）

- tabBar 四页可互跳，选中态正确；
- TDesign 组件能渲染并响应事件；
- `global.scss` 变量在页面里可直接使用；
- 工程内无 `.ts`、无 Skyline 配置、无空目录。

---

## 9. 复盘

| 日期 | 内容 |
| --- | --- |
| 2026-11-24 | 开工。Step 1–4 完成（配置迁移、TS→JS、清模板、`global.scss` + 全局重置）。发现模板原有 5 个空目录（`mock`、`packageGoods`、`goods-item`、`page-status`、`price`），已一并清理。 |
| 2026-11-24 | `tdesign-miniprogram@1.18.0` 安装完成，`package.json` 已更新；`node_modules` 中确认 `"miniprogram": "miniprogram_dist"` 入口。待 Step 5 手动构建 npm 验证。 |
| 2026-11-24 | 首次编译报「路径下未找到组件」，排查发现 `miniprogram/miniprogram_npm/` 根本不存在 → `miniprogramRoot` 为子目录时，工具不会去根目录找 `node_modules`。先尝试 `packNpmManually: true` + `packNpmRelationList` 指向根清单，**未生效**；最终把 `package.json` 与 `node_modules` 直接放进 `miniprogram/`，回到工具默认路径。**教训一：组件报「找不到」，先看 `miniprogram_npm` 有没有生成，而不是改 `usingComponents` 路径。教训二：TDesign 依赖 `tslib` 但未声明，必须手动装。** |
| 2026-11-24 | 根目录残留的 `node_modules`（旧方案产物）无法脚本删除（被占用/安全删除拦截），手工删掉即可，不影响构建 npm。 |
| 2026-11-24 | 依赖搬进 `miniprogram/` 后 `miniprogram_npm/` 依旧未生成 → 判定该 IDE 的「构建 npm」未真正产出。改用手工镜像：拷贝 `miniprogram_dist` → `miniprogram_npm/tdesign-miniprogram`（1191 个文件），`tslib.js` → `miniprogram_npm/tslib/index.js`。**这一步是绕路，工具恢复正常后应重跑构建 npm 覆盖。** |
| 2026-11-24 | 组件能找到后，运行时报 `Unexpected token 'export'`，级联出 `module 'app.js' is not defined`。根因是模板里 `"es6": false`——ES6 模块（TDesign 产物全量是 `import/export`）没有被转译，被当作普通脚本直接执行。改 `es6: true` + `enhance: true` 解决。**教训：`es6` 不是「语法新旧」开关，而是「模块是否被转译」开关，用任何 ESM 依赖都必须开。** |
| 2026-11-24 | Step 5 通过：TDesign 按钮正常渲染、点击有 toast。至此「组件库可用」这条链路打通（产物 → 路径 → tslib → ESM 转译）。 |
| 2026-11-24 | Step 6 报 `Error: Undefined variable`：`sassSetting.scssCommonUseFilePath` 的自动注入在本机工具上不生效。改为每个 scss 顶部显式 `@import '../../global.scss';`，并**整块删除 `sassSetting`**（该字段仅见于官方模板、未在官方文档字段表中）。**教训：模板给的配置不等于官方承诺的配置，变量引入用显式 import 最稳。** |
| 2026-11-24 | Step 7 完成：建 `pages/category`、`pages/cart`、`pages/member` 三页占位（四件套 + `@import`），`app.json` 配 `pages` 与 `tabBar`（先不配图标），建 `api/`、`config/`。样板由 AI 代写，S2 起页面逻辑回归自己写。 |

**待你补充的问题 / 疑问**：
-
