/** utils/auth.js —— 登录态存取，Storage key 只在这里出现 */

const TOKEN_KEY = 'rabbit_token'

/**
 * 读取 token
 * @returns {string} 未登录返回空串，调用方可直接当布尔用
 */
export function getToken() {
  return wx.getStorageSync(TOKEN_KEY) || ''
}

/**
 * 写入 token
 * @param {string} token
 */
export function setToken(token) {
  wx.setStorageSync(TOKEN_KEY, token || '')
}

/** 清除 token（401 失效、主动退出登录） */
export function clearToken() {
  wx.removeStorageSync(TOKEN_KEY)
}
