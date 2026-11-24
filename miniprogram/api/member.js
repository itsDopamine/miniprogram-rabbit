import { request } from '../utils/request'

/**
 * 获取个人信息（必须登录）
 * @returns {Promise<Object>} id / avatar / nickname / account / gender / birthday / fullLocation / profession
 */
export function getProfile() {
  return request({ url: '/member/profile', auth: true })
}
