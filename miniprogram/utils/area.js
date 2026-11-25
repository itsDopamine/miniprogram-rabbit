/**
 * utils/area.js —— 省市区三级联动
 *
 * 数据在 data/areas.js（生成文件，code 已补零到 6 位）。
 * 只负责「下标 ↔ code ↔ 展示文案」的换算，不碰 setData。
 */
import AREAS from '../data/areas'

// 行政区划里的占位名，拼进文案很难看（"北京市 市辖区 东城区"）
const PLACEHOLDER = ['市辖区', '省直辖县级行政区划', '自治区直辖县级行政区划']

/**
 * 三列 picker 的候选文案，下标跟着上一级走
 * @param {number[]} indexes [省, 市, 区]
 * @returns {string[][]}
 */
export function getColumns(indexes) {
  const [pIndex, cIndex] = indexes

  const province = AREAS[pIndex] || AREAS[0]
  const cities = province.children || []
  const city = cities[cIndex] || cities[0] || { children: [] }

  return [
    AREAS.map((p) => p.name),
    cities.map((c) => c.name),
    (city.children || []).map((d) => d.name)
  ]
}

/**
 * 下标 → 接口要的三个 code
 * @param {number[]} indexes
 * @returns {{provinceCode: string, cityCode: string, countyCode: string}}
 */
export function getCodes(indexes) {
  const [pIndex, cIndex, dIndex] = indexes

  const province = AREAS[pIndex] || AREAS[0]
  const cities = province.children || []
  const city = cities[cIndex] || cities[0] || { children: [] }
  const county = (city.children || [])[dIndex] || {}

  return {
    provinceCode: province.code,
    cityCode: city.code || '',
    countyCode: county.code || ''
  }
}

/**
 * 已有地址的 code → picker 下标，找不到就退回 0
 * @param {{provinceCode?, cityCode?, countyCode?}} address
 * @returns {number[]}
 */
export function getIndexes(address) {
  const codes = address || {}

  const pIndex = Math.max(
    AREAS.findIndex((p) => p.code === codes.provinceCode),
    0
  )
  const cities = AREAS[pIndex].children || []
  const cIndex = Math.max(
    cities.findIndex((c) => c.code === codes.cityCode),
    0
  )
  const counties = (cities[cIndex] || {}).children || []
  const dIndex = Math.max(
    counties.findIndex((d) => d.code === codes.countyCode),
    0
  )

  return [pIndex, cIndex, dIndex]
}

/**
 * 下标 → 「北京市 东城区」这种展示文案（过滤掉占位名）
 * @param {number[]} indexes
 * @returns {string}
 */
export function formatArea(indexes) {
  const [pIndex, cIndex, dIndex] = indexes

  const province = AREAS[pIndex] || AREAS[0]
  const city = (province.children || [])[cIndex] || {}
  const county = (city.children || [])[dIndex] || {}

  return [province.name, city.name, county.name]
    .filter((name) => name && PLACEHOLDER.indexOf(name) < 0)
    .join(' ')
}
