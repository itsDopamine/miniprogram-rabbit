// utils/feedback.js —— toast / loading 的统一封装
// loading 用计数管理：并发请求时不会「第一个回来就把 loading 关了」
let loadingCount = 0

function showLoading(title) {
  if (loadingCount === 0) {
    wx.showLoading({
      title: title || '加载中',
      mask: true,
    })
  }
  loadingCount += 1
}

function hideLoading() {
  loadingCount = Math.max(0, loadingCount - 1)
  if (loadingCount === 0) {
    wx.hideLoading()
  }
}

function toast(title, icon) {
  const text = String(title || '操作失败')
  wx.showToast({
    title: text.length > 40 ? `${text.slice(0, 40)}…` : text,
    icon: icon || 'none',
    duration: 2000,
  })
}

module.exports = {
  showLoading,
  hideLoading,
  toast,
}
