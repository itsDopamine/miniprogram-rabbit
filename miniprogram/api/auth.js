import { request } from '../utils/request'

/**
 * 用户名密码登录
 * 测试账号 13123456789 / 密码 123456（来源：Apifox 会员登录分组）
 * 不带 auth：登录接口本身不需要 token
 * @param {{account: string, password: string}} params
 * @returns {Promise<Object>} 含 token / id / account / nickname / avatar 等
 */
export function loginByPassword({ account, password }) {
  return request({
    url: '/login',
    method: 'POST',
    data: { account, password },
    loading: true
  })
}

/**
 * 微信手机号一键登录
 * encryptedData / iv 来自 <button open-type="getPhoneNumber"> 的回调
 * 前置条件：企业主体小程序 + 开发者列表，且基础库仍返回 encryptedData
 * （新版基础库只回 code，需后端用 code 换手机号，本接口不适配那种形态）
 * @param {{code: string, encryptedData: string, iv: string}} params
 */
export function loginByWxMin({ code, encryptedData, iv }) {
  return request({
    url: '/login/wxMin',
    method: 'POST',
    data: { code, encryptedData, iv },
    loading: true
  })
}

/**
 * 微信手机号登录（内测模拟版）
 * 只传手机号、服务端不校验真实性，Apifox 注明「开发学习使用」
 * 实测可用：返回 token + id + account + mobile
 * @param {string} phoneNumber
 */
export function loginByPhoneSimple(phoneNumber) {
  return request({
    url: '/login/wxMin/simple',
    method: 'POST',
    data: { phoneNumber },
    loading: true
  })
}
