---
name: miniprogram-mall-learning-plan
overview: 编写 idoc/00-plan.md：一份「边学边开发」的小程序商城学习与开发计划，按模块分 S0–S8 共 9 个阶段，每阶段含知识点、任务拆分、对应接口与验收标准，推进方式遵循「我讲你写」。
todos:
  - id: write-plan-skeleton
    content: 创建 idoc/00-plan.md 骨架：协作方式、技术栈与工程现状、S0–S8 阶段总览表
    status: completed
  - id: map-react-api
    content: 用 [subagent:code-explorer] 梳理 React 版页面与接口对应关系，产出接口映射表
    status: completed
    dependencies:
      - write-plan-skeleton
  - id: detail-stage-s0-s4
    content: 撰写 S0–S4 阶段详情：环境规范、请求层与 tabBar、首页、分类搜索、详情 SKU
    status: completed
    dependencies:
      - map-react-api
  - id: detail-stage-s5-s8
    content: 撰写 S5–S8 阶段详情：登录个人中心、购物车、结算订单支付、分包与性能收尾
    status: completed
    dependencies:
      - detail-stage-s0-s4
  - id: write-risks-table
    content: 补充待确认项与风险章：字段获取约定、收藏功能降级、内测接口说明
    status: completed
    dependencies:
      - map-react-api
  - id: finalize-plan
    content: 通读校对路径与阶段依赖，补上 S0 首个任务的启动说明
    status: completed
    dependencies:
      - detail-stage-s5-s8
      - write-risks-table
---

## 用户需求

用户在 **F:/Web/react-rabbit**（React 版小兔鲜儿商城）已完成后，希望转入 **f:/WeChatProjects/miniprogram-rabbit**，用小程序原生框架重做同一套商城，并以「边学边开发」的方式推进。本次交付物是**一份学习与开发计划文档**（`idoc/00-plan.md`），不写业务代码。

## 已确认的范围与节奏

- 功能范围：**全量对标 React 版**，并尽量覆盖接口文档中可实现的全部能力——首页（广告/分类/热门/新鲜好物/猜你喜欢）、分类、搜索、商品详情与 SKU 选择、购物车、登录、个人中心（信息/地址/订单）、结算下单、（模拟）支付。
- 节奏：**每天 3 小时以上**，按模块划分阶段，总周期约 3–4 周。
- 产出：先出计划文档，确认后按阶段逐个推进。

## 计划文档的内容要求

1. **协作方式说明**：明确「我讲知识点 / 你动手写 / 我 review 验收」的三段式，每阶段拆成可独立验收的小任务，不整段代写页面。
2. **阶段总览表**：S0 环境与规范 → S1 请求层与导航/tabBar → S2 首页 → S3 分类与搜索 → S4 详情与 SKU → S5 登录与个人中心 → S6 购物车 → S7 结算/订单/支付 → S8 分包与性能收尾。
3. **每阶段详情**：学习目标、知识点清单（小程序原生概念）、任务拆解、涉及接口、验收标准、常见坑。
4. **接口映射表**：44 个接口按「分组 → 页面 → 阶段」对应，标注方法（GET/POST/PUT）与是否需要 token。
5. **待确认项**：接口目录页拿不到 path/字段，需在进入某接口前查 Apifox 详情或导出 OpenAPI JSON 到 `idoc/`；React 版有「收藏」但小程序接口文档无此分组，需给出降级方案。
6. **进度管理**：每阶段一个 git 提交节点与验收清单，便于逐阶段对齐。

## 视觉/交互效果

文档为 Markdown，结构清晰：开头一张阶段总览表 + 一张接口映射表，正文每阶段统一小节骨架（目标/知识点/我讲/你写/验收/坑），可直接当开发看板使用。


## 技术栈（目标工程，已在工程中确定）

- 微信小程序**原生框架 + TypeScript + Sass**，不引入 Taro/uni-app。
- 渲染：`app.json` 已开启 `rendererOptions.skyline`（sdkVersionBegin 3.0.0）与 `componentFramework: glass-easel`，`lazyCodeLoading: requiredComponents`。
- 编译：`project.config.json` 中 `useCompilerPlugins: ["typescript","sass"]`，Sass 公共文件配置为 `global.sass` / `global.scss`——**该文件当前不存在，需在 S0 补充**。
- 接口：`https://pcapi-xiaotuxian-front-devtest.itheima.net`，必带 `source-client: miniapp`，鉴权 `Authorization: <token>`，失败返回 401。

## 本次任务的实现方式

这是一次**文档写作任务**，不是代码改造：只新建 `idoc/00-plan.md`（必要时用 `idoc/tmp` 放中间稿并清理），不改动 `miniprogram/` 下任何文件。文档中的技术方案必须与工程现状严格一致，避免给出当前配置跑不通的写法。

## 关键决策

1. **文档只写一套栈**：因 `skylineRenderEnable: true`，计划中的列表滚动、吸顶、手势等方案须按 skyline 的 `scroll-view type`、`sticky`、`worklet` 写法描述，并额外标注「切 WebView 渲染时的差异」，避免学员踩坑时无法定位。
2. **请求层单独设阶段**：把 `utils/request.ts`（Promise 封装 + 请求/响应拦截 + token 注入 + 401 统一处理 + 接口前缀集中管理）提前到 S1，后续所有页面复用，避免每页各写一份 `wx.request`。
3. **分包策略前置说明**：工程已有空目录 `packageGoods/`，计划在 S0 就确定「主包放 tabBar 四页，详情/结算/订单等放分包」的划分并写入 `app.json` 规划，避免后期搬迁。
4. **降低学习风险**：每阶段以「一个知识点 + 一个可运行小目标」推进，验收标准写成可勾选行为（例如「切 tab 后列表不重新请求」「401 时自动跳登录并回跳原页」），而不是模糊的「完成首页」。
5. **不确定即标注**：所有字段级细节统一以「查 Apifox 详情 / 导出 OpenAPI JSON」为前置动作写入文档，禁止凭 React 版记忆推定。

## 文档结构设计

```
idoc/00-plan.md
├─ 1 协作方式与学习原则
├─ 2 技术栈与工程现状（含 global.scss 缺失、tabBar/分包未配置）
├─ 3 阶段总览表（S0–S8，周期/产出/验收）
├─ 4 接口分组 × 页面 × 阶段 映射表（44 接口）
├─ 5 阶段详情 S0–S8（六小节固定骨架）
├─ 6 待确认项与风险（收藏降级、字段来源、内测接口）
└─ 7 推进记录（阶段完成后回填）
```

## 实施注意

- 文档中出现的所有路径需与真实工程一致（`miniprogram/pages/**`、`miniprogram/components/**`、`miniprogram/packageGoods/**`）。
- 阶段拆分以「一天 3 小时可完成一个任务」为粒度，S0–S8 每阶段控制在 2–4 个任务。
- 记录 React 版对应文件（如 `src/pages/detail/components/SkuSelector`、`src/utils/http.js`）作为「参考实现」，仅用于对照需求，不复制代码。


## Agent Extensions

### SubAgent
- **code-explorer**
  - Purpose: 深入梳理 `F:/Web/react-rabbit` 的页面、`src/apis`、`src/store` 与 `src/hooks`，提取每个页面调用了哪些接口、交互细节如何（尤其 SKU 选择、结算页、订单状态流转），用于填充计划文档的「接口 × 页面 × 阶段」映射表与「参考实现」一列。
  - Expected outcome: 输出一份页面-接口-交互对照清单，写入 `idoc/00-plan.md` 的映射表章节，确保阶段划分与接口分组一一对应、无遗漏。
