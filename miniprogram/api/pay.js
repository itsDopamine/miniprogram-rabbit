import { request } from '../utils/request'

/**
 * 真实微信支付：拿支付参数交给 wx.requestPayment
 * 实测（2026-11-24）有三层前置条件，缺一不可：
 * 1. 用户必须由 /login/wxMin（手机号授权）登录过，才有 openid —— 用账号密码或
 *    /login/wxMin/simple 登录的账号调用会返回 17013「当前支付对象未进行授权登录」
 * 2. appid 需在微信支付白名单（Apifox：仅 wx26729f20b9efae3a 可调）
 * 3. 订单必须是待付款，否则 18009「订单状态错误」
 * @param {string} orderId
 * @returns {Promise<Object>} 可直接喂给 wx.requestPayment 的参数
 */
export function getWxPayParams(orderId) {
  return request({ url: '/pay/wxPay/miniPay', data: { orderId }, auth: true, silent: true })
}

/**
 * 模拟支付（仅 DEV）
 * 调用后订单直接置为待发货，用于走通「提交 → 支付 → 状态流转」
 * @param {string} orderId
 */
export function mockPay(orderId) {
  return request({ url: '/pay/mock', data: { orderId }, auth: true, loading: true })
}
