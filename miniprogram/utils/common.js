/** utils/common.js —— 暂未归类的纯函数，攒够一类再拆出去 */

/**
 * 补零：9 -> '09'
 * @param {number} n
 * @returns {string}
 */
function padZero(n) {
  const s = n.toString()
  return s[1] ? s : '0' + s
}

/**
 * 时间格式化：'2026/11/24 09:05:03'
 * @param {Date} date
 * @returns {string}
 */
export function formatTime(date) {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return (
    [year, month, day].map(padZero).join('/') + ' ' + [hour, minute, second].map(padZero).join(':')
  )
}

/**
 * http 转 https：接口图片直链是 http，小程序真机只放行 https
 * @param {string} url
 * @returns {string}
 */
export function toHttps(url) {
  return (url || '').replace(/^http:\/\//, 'https://')
}

/**
 * 数量夹取：把用户输入夹到 [1, max]
 * 上限按库存算，库存小于 1 时按 1 处理——否则 Math.min(Math.max(n, 1), 0) 会夹出 0 件
 * @param {string|number} value 原始输入，可能是 '' 或 'abc'
 * @param {number} max 上限（库存）
 * @returns {number|null} 非法输入返回 null，由调用方决定退回原值还是给默认值
 */
export function clampCount(value, max) {
  const n = parseInt(value, 10)
  if (Number.isNaN(n)) return null

  const limit = Math.max(Number(max) || 0, 1)
  return Math.min(Math.max(n, 1), limit)
}
