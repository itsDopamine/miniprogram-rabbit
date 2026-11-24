/**
 * utils/collect.js —— 商品收藏（本地降级版）
 *
 * Apifox 文档没有收藏分组，所以收藏只存在本机 Storage：
 * 换设备、清缓存会丢，这是已知降级，不是遗漏（见 idoc/00-overview.md §6）。
 * 存的是商品快照，列表页不必再请求接口。
 */
const COLLECT_KEY = 'rabbit_collect'

/**
 * @typedef {Object} CollectItem
 * @property {string} id 商品 spuId
 * @property {string} name
 * @property {string} picture
 * @property {number} price
 * @property {number} time 收藏时间戳，用于排序
 */

/**
 * @returns {CollectItem[]} 恒为数组，按收藏时间倒序
 */
export function readCollect() {
  return wx.getStorageSync(COLLECT_KEY) || []
}

/**
 * @param {string} id
 * @returns {boolean}
 */
export function isCollected(id) {
  return readCollect().some((item) => item.id === id)
}

/**
 * 收藏 / 取消收藏
 * @param {{id: string, name: string, picture: string, price: number}} goods
 * @returns {boolean} 操作后是否处于「已收藏」
 */
export function toggleCollect(goods) {
  const list = readCollect()
  const index = list.findIndex((item) => item.id === goods.id)

  if (index >= 0) {
    list.splice(index, 1)
    wx.setStorageSync(COLLECT_KEY, list)
    return false
  }

  // 新收藏放最前：列表页直接按存储顺序渲染，不用再排序
  list.unshift({
    id: goods.id,
    name: goods.name || '',
    picture: goods.picture || '',
    price: Number(goods.price) || 0,
    time: Date.now()
  })
  wx.setStorageSync(COLLECT_KEY, list)
  return true
}

/**
 * 批量取消收藏
 * @param {string[]} ids
 */
export function removeCollect(ids) {
  const drop = ids || []
  wx.setStorageSync(
    COLLECT_KEY,
    readCollect().filter((item) => drop.indexOf(item.id) < 0)
  )
}
