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
