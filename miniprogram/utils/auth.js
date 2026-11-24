const TOKEN_KEY = 'rabbit_token'

export function getToken() {
  return wx.getStorageSync(TOKEN_KEY) || ''
}

export function setToken(token) {
  wx.setStorageSync(TOKEN_KEY, token || '')
}

export function clearToken() {
  wx.removeStorageSync(TOKEN_KEY)
}