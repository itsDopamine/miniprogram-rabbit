import { request } from '../utils/request'

/**
 * 结算页数据（购物车结算）
 * 服务端从购物车取勾选商品，算好运费与应付，前端只负责展示
 * @returns {Promise<{userAddresses: Array, goods: Array, summary: Object}>}
 */
export function getPreOrder() {
  return request({ url: '/member/order/pre', auth: true })
}

/**
 * 结算页数据（详情页立即购买，不经过购物车）
 * @param {{skuId: string, count: number, addressId?: string}} params
 */
export function getPreOrderNow({ skuId, count, addressId }) {
  return request({
    url: '/member/order/pre/now',
    data: { skuId, count, ...(addressId ? { addressId } : {}) },
    auth: true
  })
}

/**
 * 提交订单
 * goods 里只有 skuId 与 count：价格、运费由服务端按当前数据重算
 * @param {{goods: Array<{skuId: string, count: number}>, addressId: string, deliveryTimeType: number, payType: number, payChannel?: number, buyerMessage: string}} data
 * @returns {Promise<{id: string}>}
 */
export function submitOrder(data) {
  return request({ url: '/member/order', method: 'POST', data, auth: true, loading: true })
}

/**
 * 订单列表：orderState 不传或传 0 表示全部
 * @param {{page?: number, pageSize?: number, orderState?: number}} params
 */
export function getOrderList({ page = 1, pageSize = 10, orderState = 0 } = {}) {
  return request({ url: '/member/order', data: { page, pageSize, orderState }, auth: true })
}

/**
 * 订单详情
 * @param {string} id
 */
export function getOrderDetail(id) {
  return request({ url: `/member/order/${id}`, auth: true })
}

/**
 * 取消订单：仅待付款状态可用
 * @param {string} id
 * @param {string} cancelReason
 */
export function cancelOrder(id, cancelReason) {
  return request({
    url: `/member/order/${id}/cancel`,
    method: 'PUT',
    data: { cancelReason },
    auth: true,
    loading: true
  })
}

/**
 * 确认收货：仅待收货状态可用
 * @param {string} id
 */
export function confirmReceipt(id) {
  return request({
    url: `/member/order/${id}/receipt`,
    method: 'PUT',
    auth: true,
    loading: true
  })
}

/**
 * 删除订单：仅待评价 / 已完成 / 已取消可删，body 是 id 数组
 * @param {string[]} ids
 */
export function deleteOrders(ids) {
  return request({
    url: '/member/order',
    method: 'DELETE',
    data: { ids },
    auth: true,
    loading: true
  })
}

/**
 * 订单物流：仅待收货 / 待评价 / 已完成可查
 * @param {string} id
 * @returns {Promise<{picture: string, count: number, company: Object, list: Array}>}
 */
export function getOrderLogistics(id) {
  return request({ url: `/member/order/${id}/logistics`, auth: true })
}

/**
 * 模拟发货（仅 DEV）：待发货 -> 待收货，用来走通物流链路
 * @param {string} id
 */
export function mockConsignment(id) {
  return request({
    url: `/member/order/consignment/${id}`,
    method: 'GET',
    auth: true,
    loading: true
  })
}

/**
 * 再次购买：结构与预订单一致（userAddresses / goods / summary）
 * @param {string} id 订单 id
 */
export function getRepurchaseOrder(id) {
  return request({ url: `/member/order/repurchase/${id}`, auth: true })
}
