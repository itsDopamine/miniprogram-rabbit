/** utils/auth.js —— 登录态存取，Storage key 只在这里出现 */

const TOKEN_KEY = 'rabbit_token'
const USER_KEY = 'rabbit_user'

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

/**
 * 读取登录用户的最小信息
 * token 续期要用 account + id（PUT /login/refresh 的入参），只存 token 就续不了
 * @returns {{id: string, account: string}|null}
 */
export function getUser() {
  return wx.getStorageSync(USER_KEY) || null
}

/**
 * 登录成功 / 刷新资料成功后写入
 * @param {{id: string, account: string}} user
 */
export function setUser(user) {
  if (!user || !user.id || !user.account) return
  wx.setStorageSync(USER_KEY, { id: String(user.id), account: user.account })
}

/** 清除用户信息 */
export function clearUser() {
  wx.removeStorageSync(USER_KEY)
}

/** token 与用户信息一起清：只清一半会让续期逻辑拿着残缺数据空转 */
export function clearAuth() {
  clearToken()
  clearUser()
}
