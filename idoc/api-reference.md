# 接口参考（由 Apifox 导出，机器生成，勿手改）

> 来源：Apifox 分享文档 `0e6ee326-d646-41bd-9214-29dbf47648fa` 的公开接口树与接口详情 API，2026-11-24 抓取。
> 生成方式：`GET https://api.apifox.cn/api/v1/shared-docs/{shareId}/http-api-tree` + `GET .../http-apis/{id}`（均返回 200）。
> 本文件是**路径与字段的唯一事实来源**；`03-roadmap.md` 的路径列以本文件为准。

## 请求约定

- 基础地址：`https://pcapi-xiaotuxian-front-devtest.itheima.net`
- 必带请求头：`source-client: miniapp`
- 需要登录的接口：`Authorization: <token>`，失效返回 401
- 响应外壳：`{ code, msg, result }`，`code` 为字符串 `"1"` 表示成功（实测）

## 索引（共 44 个）

| 分组 | 方法 | 路径 | 说明 |
| --- | --- | --- | --- |
| 购物车 | POST | `/member/cart` | 加入购物车 |
| 购物车 | GET | `/member/cart` | 获取购物车列表 |
| 购物车 | DELETE | `/member/cart` | 删除/清空购物车单品 |
| 购物车 | PUT | `/member/cart/{skuId}` | 修改购物车单品 |
| 购物车 | PUT | `/member/cart/selected` | 购物车全选/取消全选 |
| 会员登录 | POST | `/login/wxMin` | 小程序登录 |
| 会员登录 | POST | `/login/wxMin/simple` | 小程序登录-内测版 |
| 会员登录 | POST | `/login` | 传统登录-用户名+密码 |
| 会员登录 | PUT | `/login/refresh` | 刷新token |
| 会员中心-地址管理 | POST | `/member/address` | 添加收货地址 |
| 会员中心-地址管理 | DELETE | `/member/address/{id}` | 删除收货地址 |
| 会员中心-地址管理 | PUT | `/member/address/{id}` | 修改收货地址 |
| 会员中心-地址管理 | GET | `/member/address/{id}` | 获取收货地址详情 |
| 会员中心-地址管理 | GET | `/member/address` | 获取收货地址列表 |
| 会员中心-订单管理 | GET | `/member/order/pre` | 填写订单-获取预付订单 |
| 会员中心-订单管理 | GET | `/member/order/pre/now` | 填写订单-获取立即购买订单 |
| 会员中心-订单管理 | GET | `/member/order/repurchase/{id}` | 填写订单-获取再次购买订单 |
| 会员中心-订单管理 | POST | `/member/order` | 提交订单 |
| 会员中心-订单管理 | GET | `/member/order/{id}` | 获取订单详情 |
| 会员中心-订单管理 | GET | `/member/order/consignment/{id}` | 模拟发货-内测版 |
| 会员中心-订单管理 | PUT | `/member/order/{id}/receipt` | 确认收货 |
| 会员中心-订单管理 | GET | `/member/order/{id}/logistics` | 获取订单物流 |
| 会员中心-订单管理 | DELETE | `/member/order` | 删除订单 |
| 会员中心-订单管理 | PUT | `/member/order/{id}/cancel` | 取消订单 |
| 会员中心-订单管理 | GET | `/member/order` | 获取订单列表 |
| 会员中心-个人信息 | GET | `/member/profile` | 获取个人信息 |
| 会员中心-个人信息 | PUT | `/member/profile` | 修改个人信息 |
| 会员中心-个人信息 | POST | `/member/profile/avatar` | 修改用户头像 |
| 热门推荐 | GET | `/hot/preference` | 特惠推荐-小程序 |
| 热门推荐 | GET | `/hot/inVogue` | 爆款推荐-小程序 |
| 热门推荐 | GET | `/hot/oneStop` | 一站买全-小程序 |
| 热门推荐 | GET | `/hot/new` | 新鲜好物-小程序 |
| 商品分类 | GET | `/category/top` | 分类列表-小程序 |
| 商品详情 | GET | `/goods` | 商品详情 |
| 商品详情 | GET | `/goods/relevant` | 同类推荐_将废弃 |
| 首页模块 | GET | `/home/banner` | 首页-广告区域-小程序 |
| 首页模块 | GET | `/home/category/mutli` | 首页-前台分类-小程序 |
| 首页模块 | GET | `/home/hot/mutli` | 首页-热门推荐-小程序 |
| 首页模块 | GET | `/home/new` | 首页-新鲜好物-小程序 |
| 首页模块 | GET | `/home/goods/guessLike` | 猜你喜欢-小程序 |
| 搜索模块 | POST | `/search/all` | 搜索-商品搜索-带筛选条件 |
| 搜索模块 | GET | `/search/tips` | 搜索-提示语 |
| 支付 | GET | `/pay/wxPay/miniPay` | 获取微信支付参数 |
| 支付 | GET | `/pay/mock` | 模拟支付-内测版 |


## 购物车

### POST /member/cart — 加入购物车

**请求体**（application/json）

- `skuId` · string **(必填)** — SKUID
- `count` · integer **(必填)** — 数量

**响应**

- 外壳字段：`msg`、`result`
- `result` · object
  - `skuId` · string **(必填)** — SKUID
  - `name` · string **(必填)** — 商品名称
  - `attrsText` · string **(必填)** — 属性文字，例如“颜色:瓷白色 尺寸：8寸”
  - `picture` · string **(必填)** — 商品图片
  - `price` · string **(必填)** — 加入时价格
  - `nowPrice` · string **(必填)** — 当前的价格
  - `selected` · boolean **(必填)** — 是否选中
  - `stock` · integer **(必填)** — 库存
  - `count` · integer **(必填)** — 数量
  - `discount` · number,null **(必填)** — 折扣信息
  - `isCollect` · boolean **(必填)** — 是否收藏
  - `isEffective` · boolean **(必填)** — 是否为有效商品
  - `id` · string **(必填)** — SPUID

### GET /member/cart — 获取购物车列表

**响应**

- 外壳字段：`msg`、`result`
- `result` · array<object>
  - `id` · string **(必填)** — SPUID
  - `name` · string **(必填)** — 商品名称
  - `picture` · string **(必填)** — 图片
  - `price` · number **(必填)** — 加入时价格
  - `count` · integer **(必填)** — 数量
  - `skuId` · string **(必填)** — SKUID
  - `attrsText` · string **(必填)** — 属性文字，例如“颜色:瓷白色 尺寸：8寸”
  - `selected` · boolean **(必填)** — 是否选中
  - `nowPrice` · number **(必填)** — 当前的价格
  - `stock` · integer **(必填)** — 库存
  - `isCollect` · boolean **(必填)** — 是否收藏
  - `discount` · number **(必填)** — 折扣信息
  - `isEffective` · boolean **(必填)** — 是否为有效商品

### DELETE /member/cart — 删除/清空购物车单品

**请求体**（application/json）

- `ids` · array<string> **(必填)** — SKUID集合

**响应**

- 外壳字段：`msg`

### PUT /member/cart/{skuId} — 修改购物车单品

**请求参数**

| 位置 | 名称 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| path | `skuId` | string | 是 | SKU ID |

**请求体**（application/json）

- `selected` · boolean — 选中状态 - 可选参数
- `count` · integer — 商品数量 - 可选参数

**响应**

- 外壳字段：`msg`、`result`
- `result` · object
  - `id` · string **(必填)** — id
  - `name` · string **(必填)** — 商品名称
  - `picture` · string **(必填)** — 图片
  - `price` · number **(必填)** — 加入时价格
  - `count` · integer **(必填)** — 数量
  - `skuId` · string **(必填)** — SKUID
  - `attrsText` · string **(必填)** — 属性文字，例如“颜色:瓷白色 尺寸：8寸”
  - `selected` · boolean **(必填)** — 是否选中
  - `nowPrice` · number **(必填)** — 当前的价格
  - `stock` · integer **(必填)** — 库存
  - `isCollect` · boolean **(必填)** — 是否收藏
  - `discount` · number **(必填)** — 折扣信息
  - `isEffective` · boolean **(必填)** — 是否为有效商品

### PUT /member/cart/selected — 购物车全选/取消全选

**请求体**（application/json）

- `selected` · boolean **(必填)** — 是否选中

**响应**

- 外壳字段：`msg`、`result`
- `result` · object


## 会员登录

### POST /login/wxMin — 小程序登录

> **注意**：调用该接口需要使用企业小程序 **`appid`** ，且把微信号添加到**开发者列表**中。

**请求体**（application/json）

- `encryptedData` · string **(必填)** — 通过 getphonenumber 事件回调中获取
- `iv` · string **(必填)** — 通过 getphonenumber 事件回调中获取
- `code` · string **(必填)** — code 通过 wx.login() 获取

**响应**

- 外壳字段：`msg`、`result`
- `result` · object
  - `id` · number **(必填)** — 用户id
  - `mobile` · string **(必填)** — 用户手机号
  - `token` · string **(必填)** — 用于后续接口调用的token，有效期三天
  - `nickname` · string,null **(必填)** — 用户昵称
  - `avatar` · string **(必填)** — 用户头像
  - `account` · string **(必填)** — 用户名

### POST /login/wxMin/simple — 小程序登录-内测版

> 该接口用于**模拟微信小程序一键登录**，开发学习使用。

**请求体**（application/json）

- `phoneNumber` · string **(必填)** — 不传加密信息时，模拟的手机号必传

**响应**

- 外壳字段：`msg`、`result`
- `result` · object
  - `id` · string **(必填)** — 用户id
  - `account` · string **(必填)** — 用户名
  - `mobile` · string **(必填)** — 用户手机号
  - `token` · string **(必填)** — 用于后续接口调用的token，有效期三天
  - `avatar` · string **(必填)** — 用户头像
  - `nickname` · string,null **(必填)** — 用户昵称

### POST /login — 传统登录-用户名+密码

> 测试账号：`13123456789` 密码：`123456`，测试账号仅开发学习使用。

**请求体**（application/json）

- `account` · string **(必填)** — 用户名或手机号
- `password` · string **(必填)** — 密码

**响应**

- 外壳字段：`msg`、`result`
- `result` · object
  - `id` · number **(必填)** — 用户ID
  - `mobile` · string **(必填)** — 手机号
  - `token` · string **(必填)**
  - `nickname` · string **(必填)**
  - `avatar` · string **(必填)**
  - `gender` · string **(必填)** — 性别，男、女、未知
  - `birthday` · string **(必填)** — 生日
  - `cityCode` · string **(必填)** — 城市编码
  - `provinceCode` · string **(必填)** — 省份编码
  - `profession` · string **(必填)** — 职业

### PUT /login/refresh — 刷新token

> token 有效期为三天，当 token 过期后，调用改接口，根据过期 token 和用户的信息，可再次换取新的 token 值

**请求体**（application/json）

- `account` · string **(必填)** — 用户名或手机号
- `id` · string **(必填)** — 用户id

**响应**

- 外壳字段：`msg`、`result`
- `result` · object
  - `id` · number **(必填)** — 用户ID
  - `mobile` · string **(必填)** — 手机号
  - `token` · string **(必填)**
  - `nickname` · string **(必填)**
  - `avatar` · string **(必填)**
  - `gender` · string **(必填)** — 性别，男、女、未知
  - `birthday` · string **(必填)** — 生日
  - `cityCode` · string **(必填)** — 城市编码
  - `provinceCode` · string **(必填)** — 省份编码
  - `profession` · string **(必填)** — 职业


## 会员中心-地址管理

### POST /member/address — 添加收货地址

> **isDefault:是否为默认，1为是，0为否 ，注意：此处按照接口实现**

**请求体**（application/json）

- `receiver` · string **(必填)** — 收货人姓名
- `contact` · string **(必填)** — 联系方式
- `provinceCode` · string **(必填)** — 所在省份编码
- `cityCode` · string **(必填)** — 所在城市编码
- `countyCode` · string **(必填)** — 所在区/县编码
- `address` · string **(必填)** — 详细地址
- `isDefault` · integer **(必填)** — 是否为默认，1为是，0为否

**响应**

- 外壳字段：`msg`、`result`
- `result` · object
  - `id` · integer **(必填)**

### DELETE /member/address/{id} — 删除收货地址

**请求参数**

| 位置 | 名称 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| path | `id` | string | 是 | 收货地址id |

**请求体**（none）


**响应**

- 外壳字段：`msg`、`result`
- `result` · object
  - `id` · string **(必填)**

### PUT /member/address/{id} — 修改收货地址

> **isDefault:是否为默认，1为是，0为否 ，注意：此处按照接口实现**

**请求参数**

| 位置 | 名称 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| path | `id` | string | 是 | 收货地址id |

**请求体**（application/json）

- `receiver` · string — 收货人姓名
- `contact` · string — 联系方式
- `provinceCode` · string — 所在省份编码
- `cityCode` · string — 所在城市编码
- `countyCode` · string — 所在区/县编码
- `address` · string — 详细地址
- `isDefault` · integer — 是否为默认，1为是，0为否

**响应**

- 外壳字段：`msg`、`result`
- `result` · object
  - `id` · string **(必填)** — 收货地址id

### GET /member/address/{id} — 获取收货地址详情

**请求参数**

| 位置 | 名称 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| path | `id` | string | 是 | 收货地址id |

**响应**

- 外壳字段：`msg`、`result`
- `result` · object
  - `id` · string **(必填)** — 收货地址id
  - `receiver` · string **(必填)** — 收货人姓名
  - `provinceCode` · string **(必填)** — 所在省份编码
  - `cityCode` · string **(必填)** — 所在城市编码
  - `countyCode` · string **(必填)** — 所在区/县编码
  - `address` · string **(必填)** — 详细地址
  - `isDefault` · integer **(必填)** — 是否为默认，1为是，0为否
  - `contact` · string **(必填)** — 联系方式
  - `fullLocation` · string **(必填)** — 完整行政区

### GET /member/address — 获取收货地址列表

**响应**

- 外壳字段：`msg`、`result`
- `result` · array<object>
  - `id` · string **(必填)** — 收货地址id
  - `receiver` · string **(必填)** — 收货人姓名
  - `provinceCode` · string **(必填)** — 所在省份编码
  - `cityCode` · string **(必填)** — 所在城市编码
  - `countyCode` · string **(必填)** — 所在区/县编码
  - `address` · string **(必填)** — 详细地址
  - `isDefault` · integer **(必填)** — 是否为默认，1为是，0为否
  - `contact` · string **(必填)** — 联系方式
  - `fullLocation` · string **(必填)** — 省市区(县)


## 会员中心-订单管理

### GET /member/order/pre — 填写订单-获取预付订单

**响应**

- 外壳字段：`msg`、`result`
- `result` · object
  - `userAddresses` · array<object> **(必填)** — 用户地址列表
    - `id` · string **(必填)** — id
    - `provinceCode` · string **(必填)** — 省份编码
    - `cityCode` · string **(必填)** — 城市编码
    - `countyCode` · string **(必填)** — 所在区/县编码
    - `address` · string **(必填)** — 详细地址
    - `isDefault` · integer **(必填)** — 是否为默认，1为是，0为否
    - `receiver` · string **(必填)** — 收货人
    - `contact` · string **(必填)** — 联系方式
    - `fullLocation` · string **(必填)** — 完整行政区
    - `postalCode` · string **(必填)** — 邮编
  - `goods` · array<object> **(必填)** — 商品集合
    - `id` · string **(必填)** — id
    - `name` · string **(必填)** — 商品名称
    - `picture` · string **(必填)** — 图片
    - `count` · integer **(必填)** — 数量
    - `skuId` · string **(必填)** — SKUID
    - `attrsText` · string **(必填)** — 属性文字，例如“颜色:瓷白色 尺寸：8寸”
    - `price` · number **(必填)** — 原单价
    - `payPrice` · number **(必填)** — 实付单价
    - `totalPrice` · number **(必填)** — 小计总价
    - `totalPayPrice` · number **(必填)** — 实付价格小计
  - `summary` · object **(必填)** — 结算信息
    - `goodsCount` · integer **(必填)** — 商品件数
    - `totalPrice` · number **(必填)** — 价格总计
    - `totalPayPrice` · number **(必填)** — 应付总计
    - `postFee` · number **(必填)** — 邮费
    - `discountPrice` · number **(必填)** — 折扣总计

### GET /member/order/pre/now — 填写订单-获取立即购买订单

**请求参数**

| 位置 | 名称 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| query | `skuId` | string | 是 | 商品skuId |
| query | `count` | string | 是 | 购买商品的数量 |
| query | `addressId` | string | 否 | 下单时已经选择好的地址id |

**响应**

- 外壳字段：`msg`、`result`
- `result` · object
  - `userAddresses` · array<object> **(必填)** — 用户地址列表
    - `id` · string **(必填)** — id
    - `provinceCode` · string **(必填)** — 省份编码
    - `cityCode` · string **(必填)** — 城市编码
    - `countyCode` · string **(必填)** — 所在区/县编码
    - `address` · string **(必填)** — 详细地址
    - `isDefault` · integer **(必填)** — 是否为默认，1为是，0为否
    - `selected` · boolean **(必填)** — 标识：传入的地址信息
  - `goods` · array<object> **(必填)** — 商品集合
    - `id` · string **(必填)** — id
    - `name` · string **(必填)** — 商品名称
    - `picture` · string **(必填)** — 图片
    - `count` · integer **(必填)** — 数量
    - `skuId` · string **(必填)** — SKUID
    - `attrsText` · string **(必填)** — 属性文字，例如“颜色:瓷白色 尺寸：8寸”
    - `price` · number **(必填)** — 原单价
    - `payPrice` · number **(必填)** — 实付单价
    - `totalPrice` · number **(必填)** — 小计总价
    - `totalPayPrice` · number **(必填)** — 实付价格小计
  - `summary` · object **(必填)** — 综述信息
    - `goodsCount` · integer **(必填)** — 商品件数
    - `totalPrice` · number **(必填)** — 价格总计
    - `totalPayPrice` · number **(必填)** — 应付总计
    - `postFee` · number **(必填)** — 邮费
    - `discountPrice` · number **(必填)** — 折扣总计

### GET /member/order/repurchase/{id} — 填写订单-获取再次购买订单

**请求参数**

| 位置 | 名称 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| path | `id` | string | 是 | 订单id |

**响应**

- 外壳字段：`msg`、`result`
- `result` · object
  - `userAddresses` · array<object> **(必填)** — 用户地址列表
    - `id` · string **(必填)** — id
    - `provinceCode` · string **(必填)** — 省份编码
    - `cityCode` · string **(必填)** — 城市编码
    - `countyCode` · string **(必填)** — 所在区/县编码
    - `address` · string **(必填)** — 详细地址
    - `isDefault` · integer **(必填)** — 是否为默认，1为是，0为否
  - `goods` · array<object> **(必填)** — 商品集合
    - `id` · string **(必填)** — id
    - `name` · string **(必填)** — 商品名称
    - `picture` · string **(必填)** — 图片
    - `count` · integer **(必填)** — 数量
    - `skuId` · string **(必填)** — SKUID
    - `attrsText` · string **(必填)** — 属性文字，例如“颜色:瓷白色 尺寸：8寸”
    - `price` · number **(必填)** — 原单价
    - `payPrice` · number **(必填)** — 实付单价
    - `totalPrice` · number **(必填)** — 小计总价
    - `totalPayPrice` · number **(必填)** — 实付价格小计
  - `summary` · object **(必填)** — 综述信息
    - `goodsCount` · integer **(必填)** — 商品件数
    - `totalPrice` · number **(必填)** — 价格总计
    - `totalPayPrice` · number **(必填)** — 应付总计
    - `postFee` · number **(必填)** — 邮费
    - `discountPrice` · number **(必填)** — 折扣总计

### POST /member/order — 提交订单

**请求体**（application/json）

- `goods` · array<object> **(必填)** — 商品集合
  - `skuId` · string **(必填)** — skuId
  - `count` · integer **(必填)** — 数量
- `addressId` · string **(必填)** — 所选地址Id
- `deliveryTimeType` · integer **(必填)** — 配送时间类型，1为不限，2为工作日，3为双休或假日
- `payType` · integer **(必填)** — 支付方式，1为在线支付，2为货到付款
- `payChannel` · integer **(必填)** — 支付渠道：支付渠道，1支付宝、2微信--支付方式为在线支付时，传值，为货到付款时，不传值
- `buyerMessage` · string **(必填)** — 买家留言

**响应**

- 外壳字段：`msg`、`result`
- `result` · object
  - `id` · string **(必填)** — 订单Id

### GET /member/order/{id} — 获取订单详情

**请求参数**

| 位置 | 名称 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| path | `id` | string | 是 | 订单id |

**响应**

- 外壳字段：`msg`、`result`
- `result` · object
  - `id` · string **(必填)** — 订单编号
  - `createTime` · string **(必填)** — 下单时间
  - `payType` · integer **(必填)** — 支付方式，1为在线支付，2为货到付款
  - `orderState` · integer **(必填)** — 订单状态，1为待付款、2为待发货、3为待收货、4为待评价、5为已完成、6为已取消
  - `payLatestTime` · integer **(必填)** — 付款截止时间：剩余的秒数，前台转换成分钟：秒数
  - `countdown` · integer **(必填)** — 倒计时--剩余的秒数 -1 表示已经超时，正数表示倒计时未结束
  - `postFee` · string **(必填)** — 邮费
  - `payMoney` · string **(必填)** — 实付金额
  - `payChannel` · integer **(必填)** — 支付渠道，1支付宝、2微信
  - `totalMoney` · string **(必填)** — 金额合计
  - `totalNum` · string **(必填)** — 数量合计
  - `deliveryTimeType` · integer **(必填)** — 配送时间类型，1为不限，2为工作日，3为双休或假日
  - `receiverContact` · string **(必填)** — 收货人
  - `receiverMobile` · string **(必填)** — 收货人手机
  - `receiverAddress` · string **(必填)** — 收货人地址
  - `payTime` · string **(必填)** — 付款时间
  - `consignTime` · string **(必填)** — 发货时间
  - `arrivalEstimatedTime` · string **(必填)** — 预计到货时间
  - `endTime` · string **(必填)** — 交易完成时间
  - `closeTime` · string **(必填)** — 交易关闭时间
  - `evaluationTime` · string **(必填)** — 完成评价时间
  - `skus` · array<object> **(必填)** — 商品集合
    - `id` · string **(必填)** — sku id
    - `spuId` · string **(必填)** — spu id
    - `name` · string **(必填)** — 商品名称
    - `quantity` · string **(必填)** — 数量
    - `image` · string **(必填)** — 图片地址
    - `totalMoney` · number **(必填)** — 小计
    - `realPay` · number **(必填)** — 实付金额
    - `curPrice` · number **(必填)** — 单价
    - `properties` · array<object> **(必填)** — 属性集合
      - `propertyMainName` · string **(必填)** — 属性名称，如 颜色
      - `propertyValueName` · string **(必填)** — 属性值名称，如 黑色
    - `attrsText` · string **(必填)** — 属性说明

### GET /member/order/consignment/{id} — 模拟发货-内测版

> 在 `DEV` 环境中使用，仅在 **订单状态为待发货** 时，可模拟发货，调用后订单状态修改为**待收货**，包含模拟物流。

**请求参数**

| 位置 | 名称 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| path | `id` | string | 是 | 订单id |

**响应**

- 外壳字段：`msg`

### PUT /member/order/{id}/receipt — 确认收货

> 仅在订单状态为**待收货**时，可确认收货。

**请求参数**

| 位置 | 名称 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| path | `id` | string | 是 | 订单id |

**请求体**（none）


**响应**

- 外壳字段：`msg`、`result`
- `result` · object
  - `id` · string **(必填)** — 订单编号
  - `createTime` · string **(必填)** — 下单时间
  - `payType` · integer **(必填)** — 支付方式，1为在线支付，2为货到付款
  - `orderState` · integer **(必填)** — 订单状态，1为待付款、2为待发货、3为待收货、4为待评价、5为已完成、6为已取消
  - `payLatestTime` · string **(必填)** — 付款截止时间
  - `postFee` · string **(必填)** — 邮费
  - `payMoney` · string **(必填)** — 实付金额
  - `payChannel` · integer **(必填)** — 支付渠道，1支付宝、2微信
  - `totalMoney` · string **(必填)** — 金额合计
  - `totalNum` · string **(必填)** — 数量合计
  - `deliveryTimeType` · integer **(必填)** — 配送时间类型，1为不限，2为工作日，3为双休或假日
  - `receiverContact` · string **(必填)** — 收货人
  - `receiverMobile` · string **(必填)** — 收货人手机
  - `receiverAddress` · string **(必填)** — 收货人地址
  - `payTime` · string **(必填)** — 付款时间
  - `consignTime` · string **(必填)** — 发货时间
  - `endTime` · string **(必填)** — 交易完成时间
  - `closeTime` · string **(必填)** — 交易关闭时间
  - `skus` · array<object> **(必填)** — 商品集合
    - `id` · string **(必填)** — sku id
    - `spuId` · string **(必填)** — spu id
    - `name` · string **(必填)** — 商品名称
    - `quantity` · string **(必填)** — 数量
    - `image` · string **(必填)** — 图片地址
    - `totalMoney` · number **(必填)** — 小计
    - `realPay` · number **(必填)** — 实付金额
    - `curPrice` · number **(必填)** — 单价
    - `properties` · array<object> **(必填)** — 属性集合
      - `propertyMainName` · string **(必填)** — 属性名称，如 颜色
      - `propertyValueName` · string **(必填)** — 属性值名称，如 黑色

### GET /member/order/{id}/logistics — 获取订单物流

> 仅在订单状态为**待收货，待评价，已完成**时，可获取物流信息。

**请求参数**

| 位置 | 名称 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| path | `id` | string | 是 | 订单编号 |

**响应**

- 外壳字段：`msg`、`result`
- `result` · object
  - `picture` · string **(必填)** — 商品图片
  - `count` · integer **(必填)** — 商品件数
  - `company` · object **(必填)** — 快递公司
    - `name` · string **(必填)** — 公司名称
    - `number` · string **(必填)** — 快递编号
    - `tel` · string **(必填)** — 联系电话
  - `list` · array<object> **(必填)** — 物流日志
    - `id` · string **(必填)** — 信息ID
    - `text` · string **(必填)** — 信息文字
    - `time` · string **(必填)** — 时间

### DELETE /member/order — 删除订单

> 仅在订单状态为**待评价，已完成，已取消**时，可删除订单。

**请求体**（application/json）

- `ids` · array<string> **(必填)** — 订单集合

**响应**

- 外壳字段：`msg`

### PUT /member/order/{id}/cancel — 取消订单

> 仅在订单状态为**待付款**时，可取消订单。

**请求参数**

| 位置 | 名称 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| path | `id` | string | 是 | 订单id |

**请求体**（application/json）

- `cancelReason` · string **(必填)** — 取消理由

**响应**

- 外壳字段：`msg`、`result`
- `result` · object
  - `id` · string **(必填)** — 订单编号
  - `createTime` · string **(必填)** — 下单时间
  - `payType` · integer **(必填)** — 支付方式，1为在线支付，2为货到付款
  - `orderState` · integer **(必填)** — 订单状态，1为待付款、2为待发货、3为待收货、4为待评价、5为已完成、6为已取消
  - `payLatestTime` · string **(必填)** — 付款截止时间
  - `postFee` · string **(必填)** — 邮费
  - `payMoney` · string **(必填)** — 实付金额
  - `payChannel` · integer **(必填)** — 支付渠道，1支付宝、2微信
  - `totalMoney` · string **(必填)** — 金额合计
  - `totalNum` · string **(必填)** — 数量合计
  - `deliveryTimeType` · integer **(必填)** — 配送时间类型，1为不限，2为工作日，3为双休或假日
  - `receiverContact` · string **(必填)** — 收货人
  - `receiverMobile` · string **(必填)** — 收货人手机
  - `receiverAddress` · string **(必填)** — 收货人地址
  - `payTime` · string **(必填)** — 付款时间
  - `consignTime` · string **(必填)** — 发货时间
  - `endTime` · string **(必填)** — 交易完成时间
  - `closeTime` · string **(必填)** — 交易关闭时间
  - `skus` · array<object> **(必填)** — 商品集合
    - `id` · string **(必填)** — sku id
    - `spuId` · string **(必填)** — spu id
    - `name` · string **(必填)** — 商品名称
    - `quantity` · string **(必填)** — 数量
    - `image` · string **(必填)** — 图片地址
    - `totalMoney` · number **(必填)** — 小计
    - `realPay` · number **(必填)** — 实付金额
    - `curPrice` · number **(必填)** — 单价
    - `properties` · array<object> **(必填)** — 属性集合
      - `propertyMainName` · string **(必填)** — 属性名称，如 颜色
      - `propertyValueName` · string **(必填)** — 属性值名称，如 黑色

### GET /member/order — 获取订单列表

**请求参数**

| 位置 | 名称 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| query | `page` | integer | 否 | 页码 |
| query | `pageSize` | integer | 否 | 页容量 |
| query | `orderState` | integer | 否 | 订单状态，1为待付款、2为待发货、3为待收货、4为待评价、5为已完成、6为已取消，未传该参数或0为全部 |

**响应**

- 外壳字段：`msg`、`result`
- `result` · object
  - `counts` · integer **(必填)** — 总记录数
  - `pageSize` · string **(必填)** — 页尺寸
  - `pages` · string **(必填)** — 总页数
  - `page` · string **(必填)** — 当前页码
  - `items` · array<object> **(必填)** — 数据集合
    - `id` · string **(必填)** — 订单编号
    - `createTime` · string **(必填)** — 下单时间
    - `payType` · integer **(必填)** — 支付方式，1为在线支付，2为货到付款
    - `orderState` · integer **(必填)** — 订单状态，1为待付款、2为待发货、3为待收货、4为待评价、5为已完成、6为已取消
    - `payLatestTime` · string **(必填)** — 付款截止时间
    - `countdown` · integer **(必填)** — 倒计时--剩余的秒数 -1 表示已经超时，正数表示倒计时未结束
    - `postFee` · number **(必填)** — 邮费
    - `payMoney` · number **(必填)** — 实付金额
    - `totalMoney` · number **(必填)** — 金额合计
    - `totalNum` · string **(必填)** — 数量合计
    - `skus` · array<object> **(必填)** — 商品集合
      - `id` · string **(必填)** — sku id
      - `spuId` · string **(必填)** — spu id
      - `name` · string **(必填)** — 商品名称
      - `quantity` · integer **(必填)** — 数量
      - `image` · string **(必填)** — 图片地址
      - `curPrice` · number **(必填)** — sku价格
      - `realPay` · number **(必填)** — 实付金额
      - `properties` · array<object> **(必填)** — 属性集合
      - `attrsText` · string **(必填)** — 属性例如“颜色:瓷白色 尺寸：8寸”


## 会员中心-个人信息

### GET /member/profile — 获取个人信息

**响应**

- 外壳字段：`msg`、`result`
- `result` · object
  - `id` · string **(必填)** — 用户Id
  - `avatar` · string **(必填)** — 头像
  - `nickname` · string,null **(必填)** — 昵称
  - `account` · string **(必填)** — 账号名称
  - `gender` · string,null **(必填)** — 性别，男、女、未知
  - `birthday` · string,null **(必填)** — 生日
  - `fullLocation` · string **(必填)** — 省市区的名称：如山东省济南市里历下区
  - `profession` · string,null **(必填)** — 职业

### PUT /member/profile — 修改个人信息

**请求体**（application/json）

- `nickname` · string,null — 昵称
- `gender` · string,null — 性别，男、女、未知
- `birthday` · string,null — 生日 YYYY-MM-DD
- `cityCode` · string,null — 城市编码
- `provinceCode` · string,null — 省份编码
- `countyCode` · string,null — 区/县编码
- `profession` · string,null — 职业

**响应**

- 外壳字段：`msg`、`result`
- `result` · object
  - `id` · string **(必填)** — 用户Id
  - `avatar` · string **(必填)** — 头像
  - `token` · string **(必填)** — token
  - `nickname` · string **(必填)** — 昵称
  - `account` · string **(必填)** — 账号名称
  - `gender` · string **(必填)** — 性别，男、女、未知
  - `birthday` · string **(必填)** — 生日
  - `fullLocation` · string **(必填)** — 省市区的名称：如山东省济南市里历下区
  - `profession` · string **(必填)** — 职业

### POST /member/profile/avatar — 修改用户头像

> 小程序端通过 `wx.uploadFile` 上传文件，网页端通过 `formData` 上传文件。

**响应**

- 外壳字段：`msg`、`result`
- `result` · object
  - `avatar` · string **(必填)** — 头像信息


## 热门推荐

### GET /hot/preference — 特惠推荐-小程序

> 目前特惠推荐分为了抢先尝鲜、新品预告

**请求参数**

| 位置 | 名称 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| query | `subType` | string | 否 | Tab 项的 id，默认查询全部 Tab 项的第 1 页数据 |
| query | `pageSize` | integer | 否 | 分页数据每页条数 |
| query | `page` | integer | 否 | 分页页码 |

**响应**

- 外壳字段：`msg`、`result`
- `result` · object
  - `title` · string **(必填)** — 活动标题
  - `id` · string **(必填)** — id信息
  - `bannerPicture` · string **(必填)** — 活动图片
  - `subTypes` · array<object> **(必填)** — 子类选项集合
    - `id` · string **(必填)** — 子类选项id
    - `title` · string **(必填)** — 子类选项名称
    - `goodsItems` · array<object> **(必填)**
      - `items` · array<object> **(必填)** — 商品集合
      - `counts` · string **(必填)** — 总数量
      - `pages` · string **(必填)** — 总页数
      - `page` · string **(必填)** — 页码
      - `pageSize` · string **(必填)** — 页容量

### GET /hot/inVogue — 爆款推荐-小程序

> 目前爆款推荐分为了24小时热榜，热销总榜，人气周榜

**请求参数**

| 位置 | 名称 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| query | `subType` | string | 否 | Tab 项的 id，默认查询全部 Tab 项的第 1 页数据 |
| query | `pageSize` | integer | 否 | 分页数据每页条数 |
| query | `page` | integer | 否 | 分页页码 |

**响应**

- 外壳字段：`msg`、`result`
- `result` · object
  - `title` · string **(必填)** — 活动标题
  - `id` · string **(必填)** — id信息
  - `bannerPicture` · string **(必填)** — 活动图片
  - `subTypes` · array<object> **(必填)** — 子类选项集合
    - `id` · string **(必填)** — 子类选项id
    - `title` · string **(必填)** — 子类选项名称
    - `goodsItems` · array<object> **(必填)**
      - `items` · array<object> **(必填)** — 商品集合
      - `counts` · string **(必填)** — 总数量
      - `pages` · string **(必填)** — 总页数
      - `page` · string **(必填)** — 页码
      - `pageSize` · string **(必填)** — 页容量

### GET /hot/oneStop — 一站买全-小程序

> 目前一站全买分为了搞定熊孩子，家里不凌乱，让音质更出众三个子项

**请求参数**

| 位置 | 名称 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| query | `subType` | string | 否 | Tab 项的 id，默认查询全部 Tab 项的第 1 页数据 |
| query | `pageSize` | integer | 否 | 分页数据每页条数 |
| query | `page` | integer | 否 | 分页页码 |

**响应**

- 外壳字段：`msg`、`result`
- `result` · object
  - `title` · string **(必填)** — 活动标题
  - `id` · string **(必填)** — id信息
  - `bannerPicture` · string **(必填)** — 活动图片
  - `subTypes` · array<object> **(必填)** — 子类选项集合
    - `id` · string **(必填)** — 子类选项id
    - `title` · string **(必填)** — 子类选项名称
    - `goodsItems` · array<object> **(必填)**
      - `items` · array<object> **(必填)** — 商品集合
      - `counts` · string **(必填)** — 总数量
      - `pages` · string **(必填)** — 总页数
      - `page` · string **(必填)** — 页码
      - `pageSize` · string **(必填)** — 页容量

### GET /hot/new — 新鲜好物-小程序

> 目前新鲜好物分为了抢先尝鲜、新品预告

**请求参数**

| 位置 | 名称 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| query | `subType` | string | 否 | Tab 项的 id，默认查询全部 Tab 项的第 1 页数据 |
| query | `pageSize` | integer | 否 | 分页数据每页条数 |
| query | `page` | integer | 否 | 分页页码 |

**响应**

- 外壳字段：`msg`、`result`
- `result` · object
  - `title` · string **(必填)** — 活动标题
  - `id` · string **(必填)** — id信息
  - `bannerPicture` · string **(必填)** — 活动图片
  - `subTypes` · array<object> **(必填)** — 子类选项集合
    - `id` · string **(必填)** — 子类选项id
    - `title` · string **(必填)** — 子类选项名称
    - `goodsItems` · array<object> **(必填)**
      - `items` · array<object> **(必填)** — 商品集合
      - `counts` · string **(必填)** — 总数量
      - `pages` · string **(必填)** — 总页数
      - `page` · string **(必填)** — 页码
      - `pageSize` · string **(必填)** — 页容量


## 商品分类

### GET /category/top — 分类列表-小程序

**响应**

- 外壳字段：`code`、`msg`、`result`
- `result` · array<object>
  - `id` · string **(必填)** — 一级分类id
  - `name` · string **(必填)** — 一级分类名称
  - `picture` · string **(必填)** — 一级分类图片
  - `imageBanners` · array<string> **(必填)** — 一级分类图片集
  - `children` · array<object> **(必填)** — 二级分类集合
    - `id` · string **(必填)** — 二级分类id
    - `name` · string **(必填)** — 二级分类名称
    - `picture` · string **(必填)** — 二级分类图片
    - `parentId` · null **(必填)**
    - `parentName` · null **(必填)**
    - `goods` · array<object> **(必填)** — 商品集合
      - `id` · string **(必填)** — 商品id
      - `name` · string **(必填)** — 商品名称
      - `desc` · string **(必填)** — 商品描述
      - `price` · string **(必填)** — 商品价格
      - `picture` · string **(必填)** — 商品图片
      - `discount` · null **(必填)**
      - `orderNum` · integer **(必填)**
    - `categories` · null **(必填)**
    - `brands` · null **(必填)**
    - `saleProperties` · null **(必填)**


## 商品详情

### GET /goods — 商品详情

> 规格集合一定要和skus集合下的specs 顺序保持一致

**请求参数**

| 位置 | 名称 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| query | `id` | string | 是 | 商品id |

**响应**

- 外壳字段：`msg`、`result`
- `result` · object
  - `id` · string **(必填)** — id
  - `name` · string **(必填)** — 商品名称
  - `spuCode` · string **(必填)** — spu编码
  - `desc` · string **(必填)** — 备注
  - `price` · string **(必填)** — 当前价格
  - `oldPrice` · string **(必填)** — 原价
  - `discount` · integer **(必填)** — 折扣
  - `inventory` · integer **(必填)** — 库存
  - `brand` · object **(必填)** — 品牌信息
    - `id` · string **(必填)** — 品牌id
    - `name` · string **(必填)** — 品牌名称
    - `nameEn` · string **(必填)** — 品牌英文名称
    - `logo` · string **(必填)** — logo
    - `picture` · string **(必填)** — 图片
    - `type` · null **(必填)**
    - `desc` · null **(必填)**
    - `place` · null **(必填)**
  - `salesCount` · integer **(必填)** — 销量
  - `commentCount` · integer **(必填)** — 评价数量
  - `collectCount` · integer **(必填)** — 收藏数量
  - `mainVideos` · array<string> **(必填)** — 主图视频集合
  - `videoScale` · integer **(必填)** — 主图视频比例,1为1:1/16:9，2为3:4
  - `mainPictures` · array<string> **(必填)** — 主图图片集合
  - `specs` · array<object> **(必填)** — 可选规格集合备注：规格集合一定要和skus集合下的specs 顺序保持一致
    - `name` · string **(必填)** — 规格名称
    - `id` · string **(必填)**
    - `values` · array<object> **(必填)** — 可选值集合
      - `name` · string **(必填)** — 可选值名称
      - `picture` · string,null **(必填)** — 可选值图片链接
      - `desc` · string **(必填)** — 可选值备注
      - `available` · boolean — 是否可售
  - `skus` · array<object> **(必填)** — sku集合
    - `id` · string **(必填)** — sku_id
    - `skuCode` · string **(必填)** — sku编码
    - `price` · string **(必填)** — 价格
    - `oldPrice` · string **(必填)** — 旧价格
    - `inventory` · integer **(必填)** — 库存
    - `specs` · array<object> **(必填)** — 规格集合(和详情中specs的顺序一定要保持一致)
      - `name` · string **(必填)** — 规格名称
      - `valueName` · string **(必填)** — 可选值名称
    - `picture` · string — sku图片
  - `categories` · array<object> **(必填)** — 所属分类，多级以数组形式体现，如[一级分类，二级分类，三级分类]
    - `id` · string **(必填)** — 分类id
    - `name` · string **(必填)** — 分类名称
    - `layer` · integer **(必填)**
    - `parent` · object,null **(必填)**
      - `id` · string **(必填)**
      - `name` · string **(必填)**
      - `layer` · integer **(必填)**
      - `parent` · null **(必填)**
  - `details` · object **(必填)** — 商品详情
    - `pictures` · array<string> **(必填)** — 商品详情图片集合
    - `properties` · array<object> **(必填)** — 商品属性集合
      - `name` · string **(必填)** — 属性名称
      - `value` · string **(必填)** — 属性值
  - `isPreSale` · boolean **(必填)** — 是否为预售商品
  - `isCollect` · null **(必填)**
  - `recommends` · null **(必填)**
  - `userAddresses` · null **(必填)** — 用户收货地址列表
  - `similarProducts` · array<object> **(必填)** — 同类商品
    - `id` · string **(必填)** — id
    - `name` · string **(必填)** — 商品名称
    - `desc` · string **(必填)** — 备注
    - `price` · string **(必填)** — 价格
    - `picture` · string **(必填)** — 商品图片链接
    - `discount` · null **(必填)** — 折扣
    - `orderNum` · integer **(必填)** — 销量
  - `hotByDay` · array<object> **(必填)** — 24小时热销
    - `id` · string **(必填)** — id
    - `name` · string **(必填)** — 商品名称
    - `desc` · string **(必填)** — 备注
    - `price` · string **(必填)** — 价格
    - `picture` · string **(必填)** — 商品图片链接
    - `discount` · null **(必填)** — 折扣
    - `orderNum` · integer **(必填)** — 销量
  - `evaluationInfo` · null **(必填)**

### GET /goods/relevant — 同类推荐_将废弃

> 👉 请使用商品详情接口的 similarProducts 字段代替

**请求参数**

| 位置 | 名称 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| query | `id` | string | 否 | 商品ID（传入代表查询相关商品，不传代表查询猜你喜欢） |
| query | `limit` | integer | 否 | 数量限制 |

**响应**

- 外壳字段：`msg`、`result`
- `result` · array<object>
  - `id` · string **(必填)** — id
  - `picture` · string **(必填)** — 商品图片
  - `name` · string **(必填)** — 商品名称
  - `price` · string **(必填)** — 商品价格
  - `desc` · string **(必填)** — 备注
  - `discount` · number,null **(必填)** — 折扣信息


## 首页模块

### GET /home/banner — 首页-广告区域-小程序

> 除了首页调用广告区域外，其他的页面也会调用广告接口

**请求参数**

| 位置 | 名称 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| query | `distributionSite` | integer | 否 | 广告区域展示位置 1 为首页（默认值） 2 为商品分类页 |

**响应**

- 外壳字段：`msg`、`result`
- `result` · array<object>
  - `id` · string **(必填)** — id
  - `imgUrl` · string **(必填)** — banner链接
  - `hrefUrl` · string **(必填)** — 跳转链接
  - `type` · integer **(必填)** — 跳转类型1、页面2、H5 3、小程序（小程序使用）

### GET /home/category/mutli — 首页-前台分类-小程序

> 小程序查询前台分类，只查询一级类目信息（此处pc和app、mini共用了一套前台类目信息）

**响应**

- 外壳字段：`msg`、`result`
- `result` · array<object>
  - `id` · string **(必填)** — id
  - `name` · string **(必填)** — 分类名称
  - `icon` · string **(必填)** — 展示图标

### GET /home/hot/mutli — 首页-热门推荐-小程序

**响应**

- 外壳字段：`msg`、`result`
- `result` · array<object>
  - `id` · string **(必填)** — id
  - `title` · string **(必填)** — 推荐标题
  - `alt` · string **(必填)** — 推荐说明
  - `target` · string **(必填)** — 跳转地址
  - `pictures` · array<string> **(必填)** — 图片集合
  - `type` · string **(必填)** — 推荐类型

### GET /home/new — 首页-新鲜好物-小程序

**请求参数**

| 位置 | 名称 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| query | `limit` | integer | 否 | 默认值为 4，指定响应数据中商品的数量 |

**响应**

- 外壳字段：`msg`、`result`
- `result` · array<object>
  - `id` · string **(必填)** — id
  - `picture` · string **(必填)** — 商品图片链接
  - `name` · string **(必填)** — 商品名称
  - `price` · number **(必填)** — 价格
  - `desc` · string **(必填)** — 备注

### GET /home/goods/guessLike — 猜你喜欢-小程序

**请求参数**

| 位置 | 名称 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| query | `page` | integer | 否 | 页码默认值1 |
| query | `pageSize` | integer | 否 | 页大小默认是10 |

**响应**

- 外壳字段：`msg`、`result`
- `result` · object
  - `counts` · number **(必填)** — 总条数
  - `pageSize` · number **(必填)** — 每页条数
  - `pages` · number **(必填)** — 总页数
  - `page` · number **(必填)** — 当前页数
  - `items` · array<object> **(必填)** — 当前页数据
    - `id` · string **(必填)** — id
    - `name` · string **(必填)** — 商品名称
    - `desc` · string **(必填)** — 商品描述
    - `price` · number **(必填)** — 商品价格
    - `picture` · string **(必填)** — 商品图片
    - `discount` · number **(必填)** — 商品折扣
    - `orderNum` · number **(必填)** — 商品已下单数量


## 搜索模块

### POST /search/all — 搜索-商品搜索-带筛选条件

**请求体**（application/json）

- `page` · integer — 页码
- `pageSize` · integer — 页尺寸
- `keyword` · string — 所输入的关键词
- `associatedIds` · array<string> — 联想词Id集合
- `categoryId` · string — 分类id
- `brandId` · string — 品牌id
- `onlyDiscount` · boolean — 只显示特惠
- `sortField` · string — 排序字段，取值范围：[publishTime,orderNum,price,evaluateNum]
- `sortMethod` · string — 排序规则，asc为正序，desc为倒序，默认为desc

**响应**

- 外壳字段：`msg`、`result`
- `result` · object
  - `conditions` · object **(必填)** — 条件信息
    - `categories` · array<object> **(必填)** — 分类集合
      - `id` · string **(必填)** — id
      - `name` · string **(必填)** — 分类名称
    - `brands` · array<object> **(必填)** — 品牌集合
      - `id` · string **(必填)** — id
      - `name` · string **(必填)** — 品牌名称
      - `nameEn` · string **(必填)** — 品牌英文名称
      - `logo` · string **(必填)** — 品牌logo
  - `pageData` · object **(必填)** — 分页信息
    - `counts` · integer **(必填)** — 总数量
    - `pageSize` · integer **(必填)** — 每页条数
    - `pages` · integer **(必填)** — 总页数
    - `page` · integer **(必填)** — 当前页数
    - `items` · array<object> **(必填)** — 商品集合
      - `id` · string **(必填)** — id
      - `picture` · string **(必填)** — 商品图片
      - `name` · string **(必填)** — 商品名称
      - `price` · number **(必填)** — 商品价格
      - `desc` · string **(必填)** — 备注
      - `discount` · number **(必填)** — 折扣信息

### GET /search/tips — 搜索-提示语

**请求参数**

| 位置 | 名称 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| query | `keyword` | string | 是 | 所输入的关键词 |

**响应**

- 外壳字段：`msg`、`result`
- `result` · array<object>
  - `ids` · array<string> **(必填)** — 关键字id集合
  - `associatedWord` · string **(必填)** — 联想词


## 支付

### GET /pay/wxPay/miniPay — 获取微信支付参数

> 🔔重要说明 1. 由于微信支付的限制，仅 **appid** 为 `wx26729f20b9efae3a` 的开发者才能调用该接口。此外，开发者还需要微信授权登录。 2. 对于其他开发者，可以使用模拟支付接口进行开发测试，调用后，订单状态将自动更新为已支付。

**请求参数**

| 位置 | 名称 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| query | `orderId` | string | 是 | 订单Id |

**响应**

- 外壳字段：`msg`、`result`
- `result` · object
  - `timeStamp` · string **(必填)** — 时间戳，即当前的时间
  - `signType` · string **(必填)** — 签名算法
  - `package` · string **(必填)** — 统一下单接口返回的 prepay_id 参数值
  - `paySign` · string **(必填)** — 微信支付签名
  - `nonceStr` · string **(必填)** — 随机字符串，长度为32个字符以下
  - `appId` · string — appId

### GET /pay/mock — 模拟支付-内测版

> 在 `DEV` 环境中使用，模拟支付，更新订单状态为**待发货**。

**请求参数**

| 位置 | 名称 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| query | `orderId` | string | 是 | 订单Id |

**响应**

- 外壳字段：`msg`
