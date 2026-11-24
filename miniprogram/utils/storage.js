// utils/storage.js —— 本地存储的唯一入口
// 约定：token 以 storage 为准，globalData 只是内存缓存
const KEYS = {
  TOKEN: 'token',
  USER_INFO: 'userInfo',
  GUEST_CART: 'guestCart',
  SEARCH_HISTORY: 'searchHistory',
}

/* ---------------- 登录态 ---------------- */

function getToken() {
  return wx.getStorageSync(KEYS.TOKEN) || ''
}

function setToken(token) {
  if (token) {
    wx.setStorageSync(KEYS.TOKEN, token)
  } else {
    wx.removeStorageSync(KEYS.TOKEN)
  }
}

function clearToken() {
  wx.removeStorageSync(KEYS.TOKEN)
}

function getUserInfo() {
  return wx.getStorageSync(KEYS.USER_INFO) || null
}

function setUserInfo(userInfo) {
  if (userInfo) {
    wx.setStorageSync(KEYS.USER_INFO, userInfo)
  } else {
    wx.removeStorageSync(KEYS.USER_INFO)
  }
}

function clearUserInfo() {
  wx.removeStorageSync(KEYS.USER_INFO)
}

/* ---------------- 游客购物车 ---------------- */

function getGuestCart() {
  const list = wx.getStorageSync(KEYS.GUEST_CART)
  return Array.isArray(list) ? list : []
}

function setGuestCart(list) {
  wx.setStorageSync(KEYS.GUEST_CART, Array.isArray(list) ? list : [])
}

function clearGuestCart() {
  wx.removeStorageSync(KEYS.GUEST_CART)
}

/* ---------------- 搜索历史 ---------------- */

function getSearchHistory() {
  const list = wx.getStorageSync(KEYS.SEARCH_HISTORY)
  return Array.isArray(list) ? list : []
}

function setSearchHistory(list) {
  wx.setStorageSync(KEYS.SEARCH_HISTORY, Array.isArray(list) ? list.slice(0, 10) : [])
}

function clearSearchHistory() {
  wx.removeStorageSync(KEYS.SEARCH_HISTORY)
}

module.exports = {
  KEYS,
  getToken,
  setToken,
  clearToken,
  getUserInfo,
  setUserInfo,
  clearUserInfo,
  getGuestCart,
  setGuestCart,
  clearGuestCart,
  getSearchHistory,
  setSearchHistory,
  clearSearchHistory,
}
