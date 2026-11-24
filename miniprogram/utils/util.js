/**
 * 通用工具函数
 * 说明：这里用 ESM 导出，页面里 import { formatTime } from '../../utils/util'
 * （小程序支持 ESM，编译时会转成 CommonJS，不需要带 .js 后缀）
 */

/**
 * 补零：9 -> '09'
 * @param {number} n
 * @returns {string}
 */
const formatNumber = (n) => {
  const s = n.toString()
  return s[1] ? s : '0' + s
}

/**
 * 时间格式化：'2026/11/24 09:05:03'
 * @param {Date} date
 * @returns {string}
 */
export const formatTime = (date) => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return (
    [year, month, day].map(formatNumber).join('/') +
    ' ' + [hour, minute, second].map(formatNumber).join(':')
  )
}