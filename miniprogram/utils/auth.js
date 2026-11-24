// utils/auth.js —— 登录态判断、跳登录、登录后回跳
const { getToken } = require('./storage')

const LOGIN_PAGE = '/pages/login/index'

// tabBar 页面必须用 switchTab 打开，不能 redirectTo / reLaunch
const TAB_PAGES = [
  '/pages/home/index',
  '/pages/category/index',
  '/pages/cart/index',
  '/pages/member/index',
]

function isLoggedIn() {
  return Boolean(getToken())
}

function getCurrentRoute() {
  const pages = getCurrentPages()
  const current = pages[pages.length - 1]
  return current ? `/${current.route}` : ''
}

function isTabBarPage(path) {
  const purePath = String(path || '').split('?')[0]
  return TAB_PAGES.indexOf(purePath) !== -1
}

/**
 * 跳登录页，并带上来源页，登录成功后回跳
 * @param {string} [redirectPath] 来源页；不传则取当前页
 */
function goLogin(redirectPath) {
  const current = getCurrentRoute()
  if (current.indexOf(LOGIN_PAGE) === 0) return

  const redirect = redirectPath || current
  wx.reLaunch({
    url: `${LOGIN_PAGE}?redirect=${encodeURIComponent(redirect || '')}`,
  })
}

/**
 * 登录成功后的回跳：tabBar 页用 switchTab，其余用 redirectTo
 * @param {string} redirectPath 来源页（可带 query）
 */
function redirectAfterLogin(redirectPath) {
  if (!redirectPath) {
    wx.switchTab({ url: '/pages/home/index' })
    return
  }

  const path = redirectPath.charAt(0) === '/' ? redirectPath : `/${redirectPath}`

  if (isTabBarPage(path)) {
    wx.switchTab({ url: path.split('?')[0] })
    return
  }

  wx.redirectTo({ url: path })
}

module.exports = {
  LOGIN_PAGE,
  TAB_PAGES,
  isLoggedIn,
  getCurrentRoute,
  isTabBarPage,
  goLogin,
  redirectAfterLogin,
}
