# 阶段 S1 · 请求层与鉴权（零基础详细操作版）

> 状态：**未开始**
> 工时：1.5 天 · 前置：S0 完成（骨架可编译、tabBar 可用）
> 关联：[`02-architecture.md`](./02-architecture.md) §3 请求层契约

---

## 1. 学习目标

学完这一阶段，你要能回答：

- 为什么不能每个页面直接写 `wx.request`？
- `wx.request` 是回调式 API，怎么变成 `await` 能用的 Promise？`new Promise` 里 `resolve/reject` 到底在做什么？
- 一个请求可能失败在哪四个层面？分别该在哪一层处理？
- token 放在哪？401 时怎么做到「只跳一次登录」并回到原页面？
- 为什么接口域名只能出现在一个文件里？

产出：`config/env.js`、`config/constants.js`、`utils/request.js`、`api/home.js`，首页能打出真实接口数据。

---

## 2. 前置知识

### 2.1 回调式 API 长什么样

`wx.request` 不返回 Promise，它接受三个回调：

```js
wx.request({
  url: 'https://xxx/home/banner',
  method: 'GET',
  success(res) { /* res.data 是响应体 */ },
  fail(err) { /* 网络层失败：超时、断网、域名不合法 */ }
})
```

问题：成功/失败分叉在回调里，无法 `await`，也无法用 `try/catch` 统一处理。

### 2.2 三个层次各管什么

```
pages/pages/index/index.js      表现层  只管「拿数据 → setData → 响应点击」
        ↓ import
api/home.js                     数据层  只声明「路径 + 入参 + 返回类型」，不含流程
        ↓ import
utils/request.js                传输层  统一 header / 超时 / 错误分层 / 401
        ↓ import
config/env.js                   配置层  域名、公共头
```

判断某段代码该放哪一层，问一句：**「换个页面还用得上吗？」** 用得上就是下层。

### 2.3 响应的四种失败（重点）

| 层 | 现象 | 谁处理 | 页面要不要管 |
| --- | --- | --- | --- |
| 网络层 | 断网、超时、域名未配置 | `fail` 回调 | 不要，统一 toast |
| HTTP 层 | 状态码 404 / 500 | `success` 但 `statusCode !== 200` | 不要，统一 toast |
| 业务层 | HTTP 200 但 `code !== 0`（如库存不足） | 响应体里的 `code/msg` | 通常统一 toast，特殊场景页面自己接 |
| 鉴权层 | HTTP 401 | 清 token + 跳登录 | 不要，统一处理 |

> 响应体结构 `{ code, msg, result }`、`code === 0` 为成功：来源级别 **B**（React 版 `src/utils/http.js` 的实现约定），进入本阶段时用真实接口**实测确认一次**（C 级），确认后把结论写回本节。

### 2.4 接口事实（官方接口文档，级别 A）

| 项 | 值 |
| --- | --- |
| dev 域名 | `https://pcapi-xiaotuxian-front-devtest.itheima.net` |
| prod 域名 | `https://pcapi-xiaotuxian-front.itheima.net` |
| 必带请求头 | `source-client: miniapp` |
| 鉴权头 | `Authorization: <token>`（文档原文，未提 `Bearer` 前缀） |
| 未授权 | 返回 401 |

来源：https://s.apifox.cn/0e6ee326-d646-41bd-9214-29dbf47648fa

---

## 3. Step 0：前置确认（5 分钟）

1. 开发者工具「详情 → 本地设置」勾上 **不校验合法域名**（真机才必须配白名单）。
2. 打开调试器 **Network** 面板，后面每一步都要用它验证。

---

## 4. 分步实现

### Step 1：`config/env.js`（10 分钟，你写）

目标：域名只在这个文件出现。

要求：
- 导出 `BASE_URL` 与 `SOURCE_CLIENT`；
- 用 `wx.getAccountInfoSync().miniProgram.envVersion` 判断环境（`develop` / `trial` / `release`），开发与体验版走 dev 域名；
- 注释写明每个常量的来源（写「接口文档」+ 文档地址）。

> 依据：环境判断 API 见官方文档 `wx.getAccountInfoSync`。若你不想用这个 API，直接写死 dev 域名也合法，但要在注释里标「S8 再补环境切换」。

### Step 2：`config/constants.js`（10 分钟，你写）

把后面要用的枚举集中起来，**用 `Object.freeze` 代替 TS 的 `enum`**（为将来迁 TS 留路）：

```js
export const ORDER_STATE = Object.freeze({
  ALL: 0, UNPAID: 1, UNDELIVERED: 2, DELIVERED: 3, COMMENTED: 4, COMPLETED: 5, CANCELED: 6
})
```

同时导出 `ORDER_STATE_TEXT`（状态 → 中文），订单列表 S7 要用。

### Step 3：`utils/request.js` 核心（60 分钟，核心步骤）

**Promise 化的最小内核**（这是整个封装的种子，5 行）：

```js
function request({ url, method = 'GET', data = {}, header = {} }) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: BASE_URL + url,
      method,
      data,
      header: { 'source-client': 'miniapp', 'content-type': 'application/json', ...header },
      success: (res) => resolve(res),
      fail: (err) => reject(err)
    })
  })
}
```

`new Promise((resolve, reject) => {...})` 的含义：把「回调世界」包起来，`resolve(x)` 让外面的 `await` 拿到 `x`，`reject(e)` 让外面的 `catch` 拿到 `e`。

**在它之上，你要补四层判断**（顺序不能乱）：

1. `res.statusCode >= 200 && res.statusCode < 300`？否则 `reject`
2. `res.data.code === 0`？否则 `reject({ code, msg })`
3. 业务成功 → `resolve(res.data.result)`，**页面上只拿 result**
4. 任一步 `reject` 前，先做统一提示（`wx.showToast`），避免每页写一遍

**签名约定**（照这个写）：

```js
/**
 * @param {{url: string, method?: string, data?: object, auth?: boolean, loading?: boolean}} options
 * @returns {Promise<any>} 业务 result
 */
export function request(options) {}
```

`auth: true` 时才注入 token；`loading: true` 时显示 loading（注意：**并发请求要计数**，否则第一个返回就 hide 了）。

**验收点**：随便调一个接口，`console.log` 能打印出 `result`；故意把 url 写错，能进 `catch` 并且只弹一次提示。

### Step 4：token 与 401（40 分钟）

`utils/auth.js`：`getToken()` / `setToken(t)` / `clearToken()`，底层用 `wx.setStorageSync`（同步 API，小数据量最省事）。

请求头注入：`auth: true` 时 `header.Authorization = getToken() || ''`。

401 处理要点（这是本阶段最容易写错的地方）：

| 要求 | 原因 |
| --- | --- |
| 清 token | 否则后续请求继续 401 |
| **只跳一次** | 一个页面并发 3 个请求都 401，会连跳 3 次登录页，页面栈爆掉 |
| 用 `wx.redirectTo` 或加节流标志 | `navigateTo` 会压栈 |
| 带 `redirect` 参数 | 登录成功后回到原页面（S5 用） |
| 不提示「请先登录」两次 | 提示也要去重 |

实现思路（伪代码，自己写）：

```
let redirecting = false
在 401 分支：
  if (redirecting) return
  redirecting = true
  clearToken()
  toast('请先登录')
  redirectTo('/packageGoods/pages/login/login?redirect=' + encodeURIComponent(当前路径))
  登录页 onUnload 或成功登录后 setRedirecting(false)
```

> 登录页还不存在（S5 才建），本阶段可以先用 `wx.showToast` 占位，把 `redirecting` 去重逻辑写好；S5 再接真页面。

### Step 5：`api/home.js` + 首页验证（40 分钟）

- `api/home.js` 写 5 个函数（banner / 分类 / 热门 / 新鲜 / 猜你喜欢），每个都带 `@typedef` 描述返回结构；
- **字段以 Apifox 子页面为准**，不要照抄 React 版；
- 首页 `onLoad` 里 `await` 一个接口，`console.log` 或 `setData` 到页面上验证。

---

## 5. 验收

- [ ] `config/env.js` 里能改一处就切环境
- [ ] `utils/request.js`：成功返回 `result`，失败进 `catch`
- [ ] 网络错误 / HTTP 500 / 业务 `code !== 0` 三种情况都有提示且不白屏
- [ ] 手动写入错误 token，任意 `auth: true` 接口 401 后：清 token + 只提示一次 + 只跳一次
- [ ] `api/home.js` 的 5 个函数有 JSDoc，调用处有字段补全
- [ ] 页面代码里搜不到 `wx.request` 和域名字符串

---

## 6. 报错急救表

| 报错 / 现象 | 原因 | 处理 |
| --- | --- | --- |
| `request:fail url not in domain list` | 域名未加入白名单 | 工具里勾「不校验合法域名」；真机去后台配 |
| `request:fail ssl hand shake error` | 证书 / 系统时间问题 | 先用工具勾选跳过校验确认是环境问题 |
| 拿到 `undefined` | `resolve` 了 `res` 而不是 `res.data.result` | 检查 resolve 的层级 |
| 页面里 `catch` 到 `undefined` | `reject` 时没传对象 | 统一 `reject({ code, msg })` |
| 并发请求 loading 提前消失 | `showLoading` 与 `hideLoading` 不成对 | 用计数器：`++` 时 show，`--` 到 0 才 hide |
| 连续跳了多次登录页 | 401 没去重 | 加 `redirecting` 标志 + 重置时机 |

---

## 7. 阶段作业与闸门

| # | 作业 | 提交物 |
| --- | --- | --- |
| 1-1 | `config/env.js` + `config/constants.js` | 代码 + 一句「改哪行切环境」 |
| 1-2 | `utils/request.js` 完成四层判断 | 代码 + 三种失败各一张 Console 截图 |
| 1-3 | `api/home.js` 5 个函数 + JSDoc | 代码 + 首页打印出的真实数据 |
| 1-4 | 401 去重链路 | 说明 + 截图 |

### 闸门答辩（先读答案，再合上自测）

**Q1 为什么不能每页直接 `wx.request`？**
四个理由：① 域名散落各处，换环境要改 N 个文件；② token 注入、401、错误提示会在每页重复一遍且行为不一致；③ 无法统一超时与重试；④ 页面代码里混入传输细节，读起来像流水账。分层后页面只关心 `result`。

**Q2 `new Promise` 在这里到底做了什么？**
把「回调式」的异步操作包装成「可 await 的值」。`resolve(v)` 让 `await request(...)` 得到 `v`；`reject(e)` 让外层的 `catch` 拿到 `e`。没有 Promise 的话，你只能把后续逻辑写进 `success` 回调里，一层套一层。

**Q3 401 为什么要「只跳一次」？**
一个页面常并发多个请求（如详情页详情 + 库存 + 推荐）。token 失效时它们会同时 401，如果每个都跳登录页，`navigateTo` 会连续压栈，用户返回时要点很多次才能退出。加 `redirecting` 标志把并发收敛成一次。

---

## 8. 完成标志（M1）

- 首页能拿到真实接口数据（Network 面板可见）
- 四种失败场景都有统一提示，页面不白屏
- 401 只跳一次
- 页面代码零 `wx.request`

---

## 9. 复盘

| 日期 | 内容 |
| --- | --- |
| 2026-11-24 | Step 1-2 完成：`config/env.js`（BASE_URL 按 `envVersion` 切 dev/prod、导出 `SOURCE_CLIENT`）、`config/constants.js`（`ORDER_STATE` + `ORDER_STATE_TEXT`，`Object.freeze`）。<br>**发现一处真实差异**：React 版 `src/utils/http.js` 的生产域名是 `https://apipc-xiaotuxian-front.itheima.net`，而接口文档是 `https://pcapi-xiaotuxian-front.itheima.net`（`apipc` 与 `pcapi` 顺序相反）。按 A 级压 B 级的原则，以文档为准。 |
