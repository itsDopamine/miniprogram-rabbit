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
    [year, month, day].map(padZero).join('/') +
    ' ' + [hour, minute, second].map(padZero).join(':')
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
