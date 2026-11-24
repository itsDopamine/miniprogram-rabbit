// utils/format.js —— 金额、倒计时等展示格式化

/**
 * 金额格式化：统一保留两位小数
 * 空值返回空串（不是 '0.00'），便于「金额未回来时只显示 ¥」
 */
function formatPrice(value) {
  if (value === null || value === undefined || value === '') return ''

  const num = Number(value)
  return Number.isFinite(num) ? num.toFixed(2) : ''
}

/**
 * 秒数 -> mm:ss（超过 1 小时显示 hh:mm:ss）
 * @param {number} seconds 服务端 countdown 是「秒」
 */
function formatCountDown(seconds) {
  const total = Number(seconds)
  if (!Number.isFinite(total) || total <= 0) return '00:00'

  const rest = Math.floor(total)
  const hours = Math.floor(rest / 3600)
  const minutes = Math.floor((rest % 3600) / 60)
  const secs = rest % 60
  const pad = (num) => String(num).padStart(2, '0')

  return hours > 0
    ? `${pad(hours)}:${pad(minutes)}:${pad(secs)}`
    : `${pad(minutes)}:${pad(secs)}`
}

/**
 * 图片地址协议归一：接口返回 http，小程序真机要求 https
 */
function normalizeImageUrl(url) {
  if (!url) return ''
  return String(url).replace(/^http:\/\//i, 'https://')
}

module.exports = {
  formatPrice,
  formatCountDown,
  normalizeImageUrl,
}
