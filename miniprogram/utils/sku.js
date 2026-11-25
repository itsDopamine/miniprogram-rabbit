/**
 * utils/sku.js —— SKU 可用性计算（纯函数，不碰 this / setData）
 *
 * 接口只给 specs（规格组）和 skus（可售单元），没有「某值能否选」的现成字段，
 * available 实测恒为 undefined，所以全部从 skus 自己算。
 */

import { MAX_CART_COUNT } from '../config/constants'

/**
 * 把 ['颜色:黑色', '尺寸:20cm'] 拼成稳定的 key
 * 必须先排序：同一组值换个顺序拼出来就是两个 key，互相查不到
 * @param {string[]} parts
 * @returns {string}
 */
export function buildKey(parts) {
  return parts.slice().sort().join('&')
}

/**
 * 路径字典：对每个有货 sku，把它包含的所有非空子集都登记为可用
 * n 组规格 → 每个 sku 贡献 2ⁿ−1 条，这样「选了 0~n 个值」都能直接查表
 * @param {Array} skus
 * @returns {Object} { '颜色:黑色&尺寸:20cm': true }
 */
export function buildPathMap(skus) {
  const map = {}
  const list = skus || []

  list.forEach((sku) => {
    if (sku.inventory <= 0) return

    const values = sku.specs.map((s) => `${s.name}:${s.valueName}`)
    const total = 1 << values.length

    // 位掩码枚举：mask 从 1 开始，跳过空集
    for (let mask = 1; mask < total; mask++) {
      const parts = []
      for (let i = 0; i < values.length; i++) {
        if (mask & (1 << i)) parts.push(values[i])
      }
      map[buildKey(parts)] = true
    }
  })

  return map
}

/**
 * 候选值是否可选 = 存在「已选值 + 候选值」这条组合的有货 sku
 * 候选值自己那组用候选值，其它组用已选值，未选的组跳过
 * @param {Object} pathMap
 * @param {Array} specs
 * @param {string[]} selected 与 specs 等长，'' 表示未选
 * @param {number} specIndex 候选值所在规格组
 * @param {string} valueName 候选值
 * @returns {boolean}
 */
export function isAvailable(pathMap, specs, selected, specIndex, valueName) {
  const parts = []

  specs.forEach((spec, i) => {
    const value = i === specIndex ? valueName : selected[i]
    if (value) parts.push(`${spec.name}:${value}`)
  })

  return !!pathMap[buildKey(parts)]
}

/**
 * 与 specs 同构的二维布尔数组，true 表示不可选
 * @returns {boolean[][]}
 */
export function buildDisabled(pathMap, specs, selected) {
  return specs.map((spec, i) =>
    spec.values.map((v) => !isAvailable(pathMap, specs, selected, i, v.name))
  )
}

/**
 * 选全了才按顺序找 sku：接口保证 sku.specs 与 specs 同序
 * @returns {Object|null}
 */
export function findSku(skus, selected) {
  if (!selected.length || selected.some((v) => !v)) return null
  return (skus || []).find((sku) => sku.specs.every((s, i) => s.valueName === selected[i])) || null
}

/**
 * 单个 sku 的可购上限：库存与业务上限取小，且至少 1
 * 库存几千是样例数据，直接当上限会算出「合计五千万」这种数
 * @param {Object} sku
 * @returns {number}
 */
export function countLimit(sku) {
  const inventory = Number(sku && sku.inventory) || 0
  return Math.max(Math.min(inventory, MAX_CART_COUNT), 1)
}

/**
 * 已选文案：'颜色：黑色 尺寸：20cm'
 */
export function buildSelectedText(specs, selected) {
  return specs
    .map((spec, i) => (selected[i] ? `${spec.name}：${selected[i]}` : ''))
    .filter(Boolean)
    .join(' ')
}
