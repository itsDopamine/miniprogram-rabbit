# 阶段 S5 · 登录与个人中心

> 状态：**Step 1–3 代码完成**（登录闭环 + 401 回跳 + 我的页头部）；Step 5 资料编辑、Step 6 地址、Step 7 合并验证未做
> 工时：2.5 天 · 前置：S1 请求层、S4 加购（`utils/cart.js` 已有 `mergeLocalCart` 待接线）
> 关联：[`api-reference.md`](./api-reference.md) 会员登录 / 个人信息 / 地址管理、[`stage-s6-cart.md`](./stage-s6-cart.md)（合并补丁）

---

## 1. 学习目标

- 讲清 `wx.login` 拿到的 `code` 为什么只能用一次、为什么不能存起来下次用
- 会做「登录态持久化」：token 落 Storage，冷启动恢复，401 时单点清理
- 会做「登录回跳」：从哪个页面被拦，登录后就回哪个页面；tabBar 页与非 tabBar 页的回法不同
- 会用 `button open-type="chooseAvatar"` 与 `input type="nickname"` 取头像昵称
- 知道 `wx.uploadFile` 和 `wx.request` 的区别，以及为什么它不能直接套进现有封装
- 会做地址增删改查，并处理 `isDefault` 是 `1/0` 而不是布尔值的差异
- 能在登录成功后把本地购物车合并到服务端，且失败不丢数据

---

## 2. 接口事实

### 2.0 两个待拍板项（先定，再写代码）

| 项 | 备选 | 影响 |
| --- | --- | --- |
| **登录入口用哪条接口** | ① `POST /login/wxMin`（微信手机号一键登录）② `POST /login/wxMin/simple`（内测模拟）③ `POST /login`（用户名密码） | 决定登录页长什么样、要不要真机验证 |
| **一键登录是否可行** | 需「企业主体 + 已认证」小程序，且微信号在开发者列表 | 本项目 `appid` 是 `wxe3156a1306b053e8`，主体类型未确认 → 属**待实测**，不能假设可用 |

建议顺序：先用 ③ 打通闭环（最快、不依赖主体资质），再用 ② 验证「接近一键登录」的链路，最后按实测结果决定 ① 要不要上。**不要因为教程用 ① 就先按 ① 设计**，主体不满足时 `getPhoneNumber` 回调拿不到 `encryptedData`，整条路是死的。

**结论（2026-11-24，已拍板）**：先走 ③ 用户名密码。实测 `POST /login` 直接返回 `code: "1"` 与 `token`，无需任何微信侧前置条件；登录页只做账号密码表单，接口层预留位置，后续要加②/① 时只加函数不改页面。

### 2.1 三条登录路径的差异

| 接口 | 入参 | 前置条件 | 备注 |
| --- | --- | --- | --- |
| `POST /login/wxMin` | `encryptedData` / `iv` / `code` | 企业小程序 appid + 开发者列表（Apifox 注明） | `encryptedData`、`iv` 来自 `button open-type="getPhoneNumber"` 的回调 |
| `POST /login/wxMin/simple` | `phoneNumber` | 无（内测模拟） | Apifox 注明「开发学习使用」，不校验真实性 |
| `POST /login` | `account` / `password` | 无 | 测试账号 `13123456789` / `123456`（Apifox） |

三条接口的成功响应形状一致，都含 `id` / `mobile` / `token` / `nickname` / `avatar`（`/login/wxMin` 还多 `account`）。**所以登录页可以只做「拿到 token 就存」这一步，与走哪条接口无关。**

**实测记录（2026-11-24，测试账号 `13123456789`）**

- `POST /login` 返回 `code: "1"`，`result` 含 `token` / `id: "294"` / `account: "heima294"` / `nickname` / `avatar` / `gender` / `birthday` / `profession`，与 Apifox 一致
- `avatar` 是 `http://` 直链，**必须过 `toHttps`**，否则真机头像空白
- 带该 token 调 `GET /member/profile` 正常返回，字段与文档一致，`fullLocation` 可能是空串
- 该账号已有一批历史地址（8 条），正好用来验证地址列表渲染与「默认唯一」

**与 React 版的差异**：`F:\Web\react-rabbit\src\apis\user.js` 里只有 `loginAPI = ({account, password}) => http.post('/login', ...)`，没有小程序登录、也没有头像上传。这两项**没有 web 版可对齐**，只能按 Apifox + 微信官方文档做，文档里要标来源。

### 2.2 token 生命周期

- 有效期 **3 天**（Apifox 三条登录接口的 `token` 字段说明）
- 过期后 `PUT /login/refresh`，入参 `{ account, id }`，用旧 token 换新的；**该接口是否需要 `Authorization` 头 Apifox 未写，属待实测**
- 401 已在 `utils/request.js` 统一拦截：清 token → toast「请先登录」。S5 要把这里的 toast 换成「记下来源页 + 跳登录」，`redirecting` 这个并发去重标志保留

### 2.3 个人信息

`GET /member/profile` 返回 `id` / `avatar` / `nickname` / `account` / `gender` / `birthday` / `fullLocation` / `profession`。
`PUT /member/profile` 可改 `nickname` / `gender` / `birthday`(`YYYY-MM-DD`) / 省市区 `*Code` / `profession`，**响应里带新 `token`——要覆盖本地旧 token，否则可能出现「资料改了但 token 还是旧的」。**

### 2.4 头像上传

`POST /member/profile/avatar`，Apifox 只写了「小程序用 `wx.uploadFile`」，**没给表单字段名**。字段名（`file` 还是别的）属**待实测**，联调时先用 `file` 试探，以 Network 面板的实际响应为准，确认后回填本文档。

### 2.5 地址

五个接口，字段统一：`receiver` / `contact` / `provinceCode` / `cityCode` / `countyCode` / `address` / `isDefault`。

**`isDefault` 是整数 `1/0`，不是布尔**（Apifox 在两处特意强调「此处按照接口实现」）。而购物车的 `selected` 是布尔。这意味着「默认地址唯一」不能靠传参实现，需要前端在设为默认时把其它地址一并改成 0，或者以服务端行为为准（待实测：设置新默认后旧默认是否自动置 0）。

**实测补充（2026-11-24）**：`GET /member/address` 实际还返回 `postalCode`、`addressTags`（均为 `null`）两个 Apifox 未登记的字段，可忽略不必渲染；列表排序以接口返回顺序为准，并非默认地址优先，前端要自己把 `isDefault === 1` 的提到最前。

---

## 3. 前置知识

### 3.1 `wx.login` 的 code 是一次性的

```js
wx.login({ success: (res) => { /* res.code */ } })
```

官方文档明确两点：**code 只能被使用一次**、**有效期 5 分钟**。所以：

- 不能把 `code` 存进 Storage「下次登录用」
- 不能拿同一个 `code` 调两次登录接口（第二次必然失败，报 code 已使用/失效）

### 3.2 登录态持久化

Storage 里只放 token（key 已在 `utils/auth.js` 统一为 `rabbit_token`）。冷启动时 `app.onLaunch` 读出来放进 `globalData`，或在需要时现读——**两套来源必然不一致，本项目采用「现读」**：`getToken()` 直接读 Storage，`globalData.token` 不再作为真相来源。

### 3.3 登录回跳

被拦下的地方要记住「从哪来」：

| 来源类型 | 跳登录 | 登录成功后 |
| --- | --- | --- |
| 普通页（详情、订单…） | `wx.navigateTo` | `wx.navigateBack()` 回到原页 |
| tabBar 页（我的、购物车） | 不能 `navigateTo` 到 tab 页，也不能跳回来；应原地展示登录入口或 `switchTab` | `switchTab` 回原 tab |
| 401 被动拦截 | `redirectTo` 登录页并带上 `redirect` 参数 | 按参数决定 `navigateBack` 还是 `switchTab` |

**页面栈最多 10 层**，回跳优先用 `navigateBack` 而不是再 `navigateTo` 一次原页。

### 3.4 头像与昵称

```html
<button open-type="chooseAvatar" bind:chooseavatar="onChooseAvatar">
  <image src="{{avatar}}" />
</button>
<input type="nickname" bind:blur="onNicknameBlur" />
```

两者都需要基础库 **≥ 2.21.2**（官方文档）。`chooseAvatar` 回调给的是**临时文件路径**（`http://tmp/...`），必须先上传换永久 URL，不能直接存进用户资料。

### 3.5 `wx.uploadFile` 为什么不走 `request.js`

| 差异 | `wx.request` | `wx.uploadFile` |
| --- | --- | --- |
| 响应体 | 自动解析成对象 | `res.data` 是**字符串**，要自己 `JSON.parse` |
| `content-type` | 自己设 `application/json` | 由微信设置 `multipart/form-data`，**不能手动覆盖**（会破坏 boundary） |
| 判错方式 | `success` + `statusCode` | 同上，但业务 `code` 藏在解析后的字符串里 |

所以要么单独写一个 `upload()` 封装，要么在 `api/member.js` 里就地处理。公共 header（`source-client` / `Authorization`）必须手写一遍——**这正是「封装漏一层就出问题」的典型场景**。

### 3.6 地址录入用不用 `wx.chooseAddress`

`wx.chooseAddress` 要用户授权「通讯录地址」，且只回 `userName` / `telNumber` / `detailInfo`，**没有省市区 Code**，而接口要的是 `provinceCode` / `cityCode` / `countyCode`。所以要自建省市区选择器（或用 `picker` 多列联动）。**结论：不用 `wx.chooseAddress`，自建表单。** 这一点写进文档，避免后面又绕回来。

---

## 4. 分步实现

### Step 1：接口层

- `api/auth.js`：`loginByPassword`（其余两条登录路径按需再加，不进页面）
- `api/member.js`：`getProfile`（`updateProfile` / `uploadAvatar` / 地址五个方法随 Step 5、6 补）

**验收**：用开发者工具 Console 手动调 `loginByPassword` 拿到 token，`wx.setStorageSync('rabbit_token', token)` 后 `getProfile` 能返回真实昵称。

**实现记录（2026-11-24）**

- `loginByPassword` 不带 `auth`：登录接口本身不需要 token，带上反而会在旧 token 失效时多绕一圈
- `getProfile` 带 `auth: true` + 不传 `loading`：个人中心页有自己的骨架，全局遮罩会让整页闪一下
- 只加当前用得上的函数。`loginByPhoneSimple` / `loginByWxMin` 仍列在 §2.1 里，但**没有代码**——等主体资质确认再决定要不要写，避免先写一堆用不上的接口

### Step 2：登录页

- 新建 `pages/login/login`，`app.json` 注册
- 用户名密码表单 + 提交校验（空值、格式）
- 成功后 `setToken` → 按 `redirect` 参数回跳

**验收**：输错密码有提示且不跳转；输对进入下一页；杀掉小程序重进仍是登录态（`getToken()` 有值）。

**实现记录（2026-11-24）**

- 账号密码**不进 `data`**，只挂在 `this.account` / `this.password`：它们不会被程序改写，进 `data` 只会多一轮重渲染，还会踩「光标跳到末尾」那个坑（购物车数量输入框同源问题）
- `loading` 兼作防连点，按钮文案同步变「登录中…」，因为接口层的全局遮罩生效前有极短窗口
- 回跳规则写成「页面栈 > 1 就 `navigateBack`」：401 拦截是把登录页 `navigateTo` 上去的，退回原页后它的 `onShow` 会带新 token 重新取数，不需要额外传「回哪个页」
- 只有在「栈里没有上一页」（直接打开登录页）时才按 `redirect` 走，且必须区分 tabBar 与非 tabBar：tab 页只能 `switchTab`。判断依据是 `config/constants.js` 的 `TAB_PAGES`，注释里写明要与 `app.json` 同步
- 登录成功后先 `mergeLocalCart()` 再回跳，合并失败只 `console.log`，**不能让合并失败导致登录回跳卡住**

### Step 3：401 与拦截接线

- `request.js` 的 `handleUnauthorized` 改成「跳登录页并带 `redirect`」，保留 2 秒去重窗口
- 「我的」页 `onShow` 检查 `getToken()`：未登录直接展示登录引导，不做强行跳转（tabBar 页跳走体验差）

**验收**：清掉 token 后点购物车 tab（触发 `GET /member/cart`）→ 401 → 只跳一次登录页；登录成功后回到购物车且数据已加载。

**实现记录（2026-11-24）**

- 先判「当前页是不是登录页」再判去重标志：登录页自己的请求失败也会 401，不拦就会把登录页顶掉、栈里越堆越多
- `currentUrl()` 用 `page.route` + `page.options` 拼回完整路径（含 query），`redirect` 用 `encodeURIComponent` 包一层，避免 `?id=1&x=2` 把登录页自己的参数截断
- `clearToken()` 提到最前面，且不受去重影响：即便这次不跳转，失效的 token 也必须立刻清掉，否则后续请求会一直带着它
- 「我的」页**不强行跳登录**：tabBar 页被跳走再跳回来体验很差，改成未登录态展示「点击登录」，由用户自己点

### Step 4：「我的」页面

- 头像 / 昵称 / 账号；未登录态展示「点击登录」
- 功能区入口：我的订单（S7 接）、地址管理、退出登录
- 退出登录：`clearToken` + 回未登录态 + 清页面缓存

**验收**：登录前后两种状态的视觉与交互都正确；退出后不再请求带鉴权的接口。

**实现记录（2026-11-24，部分完成）**

- 已做：头像 / 昵称 / 账号头部（`toHttps` 处理头像）、未登录态「点击登录」、退出登录二次确认
- `onShow` 里判 `getToken()` 再取数：tabBar 页面常驻，登录态可能在别的页面变过，`onLoad` 只跑一次不够
- 退出登录只 `clearToken` + 回未登录态，**不主动清购物车缓存**——本地车是游客数据，退出后还应该看得到
- 未做：我的订单入口（等 S7）、地址管理（Step 6，当前是 toast 占位）

### Step 5：资料编辑

- 头像：`chooseAvatar` → `wx.uploadFile` → 拿到 URL 后 `PUT /member/profile`
- 昵称：`input type="nickname"`
- 性别 / 生日 / 职业按接口字段提交
- **`PUT /member/profile` 响应里的 `token` 要写回 Storage**

**验收**：真机改头像与昵称，返回列表刷新后仍是新值；重新进小程序不丢。

### Step 6：地址管理

- 列表（默认地址置顶 + 标记）、新增、编辑、删除（二次确认）、设默认
- 表单校验：手机号 11 位、必填项非空、省市区必须选到区县

**验收**：增删改查全通；设为默认后列表里只有一个默认（若服务端不自动置 0，前端补一次 `PUT`）。

### Step 7：登录合并（补 S6）

登录成功后按顺序：

```js
await mergeLocalCart()   // 失败不能影响登录本身
await fetchCartList()    // 以服务端为准
```

`mergeLocalCart` 已在 `utils/cart.js` 实现（失败抛错且不清 Storage），这里只负责调用与顺序：**先合并再拉列表**，顺序反了会把本地条目覆盖掉。

**验收**：未登录加 2 件 → 登录 → 购物车 2 件且不重复；断网时登录仍成功，本地条目还在，下次登录重试能合并上。

---

## 5. 常见坑

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 登录报 `code is invalid` | `code` 复用或超过 5 分钟 | 每次登录前重新 `wx.login` |
| `getPhoneNumber` 回调没有 `encryptedData` | 主体不是企业/未认证 | 改走 `/login/wxMin/simple` 或用户名密码 |
| 登录后立刻又提示未登录 | token 写进了 `globalData` 而 `request.js` 读的是 Storage | 统一读 `getToken()` |
| 改完资料 token 失效 | `PUT /member/profile` 返回了新 token 却没写回 | 响应里的 token 覆盖本地 |
| 头像显示不出来 | 存的是 `http://tmp/...` 临时路径 | 先上传换永久 URL |
| 上传报 400 / 拿不到业务字段 | `wx.uploadFile` 里手写了 `content-type` | 不要覆盖，让微信自己设 |
| 登录回跳后页面栈越来越深 | 回跳用了 `navigateTo` | 优先 `navigateBack` |
| 默认地址有两个 | `isDefault` 传了 `true`，或没把旧默认改 0 | 传 `1/0`，并确认服务端行为 |
| 登录后购物车本地条目没清 | 合并失败也清了 Storage | 成功才清（已实现） |
| tabBar 页用 `wx.navigateTo` 跳登录后回不来 | tab 页不能作为 `navigateTo` 目标 | 回跳用 `switchTab` |

---

## 6. 验收

对齐 `assignments.md` 的 5-1 ~ 5-4 与 `checklist.md` §2.4：

- [ ] `wx.login` / 密码登录闭环成功，token 落 Storage
- [ ] 杀掉小程序重进仍是登录态
- [ ] 未登录点「我的」有登录入口，登录成功后回到「我的」
- [ ] 401 被动拦截只跳一次登录页，登录后回到原页面
- [ ] 头像上传、昵称修改保存后，重进仍是新值
- [ ] 地址增删改查 + 设默认，默认地址唯一
- [ ] 未登录加购 → 登录 → 购物车合并且不重复
- [ ]（选做）本地收藏：详情页心形与收藏列表状态一致

---

## 7. 闸门答辩（先读答案，再合上自测）

**Q1 `wx.login` 的 code 为什么不能存起来下次用？**

code 是一次性凭证，只能换一次登录态，且有效期 5 分钟。存下来下次用必然失败（code 已使用 / 已过期）。正确做法是每次登录动作前重新 `wx.login`。

**Q2 token 该存哪、谁是「真相来源」？**

只存 Storage（`rabbit_token`），由 `utils/auth.js` 统一读写。`globalData` 不做真相来源——两处存同一份数据一定会分叉。需要时现读 Storage，`request.js` 就是这么做的。

**Q3 401 拦截后要怎么回到用户原来的页面？**

跳登录页时把来源带在参数里（`redirect` 或页面栈信息），登录成功后按来源类型回：普通页 `navigateBack`，tabBar 页 `switchTab`。并发 401 只处理一次，否则会连续 push 多个登录页。

**Q4 `wx.uploadFile` 和 `wx.request` 的两处关键差异？**

一是响应 `data` 是字符串，需要自己 `JSON.parse`；二是 `content-type` 必须是 `multipart/form-data` 且由微信自动生成 boundary，手写会破坏请求。公共 header 也得自己补一遍。

---

## 8. 复盘

| 日期 | 内容 |
| --- | --- |
| 2026-11-24 | 任务书建立。三条登录接口的前置条件不同（`/login/wxMin` 需企业主体），本项目 appid 主体类型未确认，故登录入口选型列为待拍板项，先按用户名密码打通闭环。另查明 React 版只有 `POST /login`，小程序登录与头像上传无 web 版可对齐，只能以 Apifox + 微信官方文档为依据。 |
| 2026-11-24 | Step 1–3 落地：`api/auth.js` + `api/member.js` + `pages/login` + 401 跳登录（带 `redirect` 回跳）+ 「我的」页头部与退出登录。实测 `POST /login` 与 `GET /member/profile` 均通，`avatar` 是 http 需 `toHttps`。三个决策：**账号密码不进 `data`**（避免重渲染与光标问题）、**回跳优先 `navigateBack`**（原页 `onShow` 会带新 token 重新取数）、**401 里先判「是否已在登录页」再去重**（否则登录页会被自己的 401 顶掉）。 |
| 2026-11-24 | 一处顺手发现：`global.scss` 的 `hairline` mixin 只支持单边（`bottom` / `top` 等），传 `all` 会生成 `all: 0` 这种无效声明，边框不出现。输入框改用普通 `border: 1px solid $border-color`。 |
