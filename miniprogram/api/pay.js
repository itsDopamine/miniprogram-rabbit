import { request } from '../utils/request'

/**
 * 模拟支付（仅 DEV）
 * 真实支付 GET /pay/wxPay/miniPay 只对 appid wx26729f20b9efae3a 开放，
 * 本项目 appid 不匹配拿不到支付参数，所以走模拟：调用后订单直接置为待发货
 * @param {string} orderId
 */
export function mockPay(orderId) {
  return request({ url: '/pay/mock', data: { orderId }, auth: true, loading: true })
}
