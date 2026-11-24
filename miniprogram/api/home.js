import { request } from '../utils/request'

/**
 * @typedef {Object} Banner
 * @property {string} id
 * @property {string} imgUrl
 * @property {string} hrefUrl
 * @property {string} type
 */

/**
 * @typedef {Object} HomeCategory
 * @property {string} id
 * @property {string} name
 * @property {string} icon
 */

/**
 * @typedef {Object} HotPanel
 * @property {string} id
 * @property {string[]} pictures
 * @property {string} title
 * @property {string} alt
 * @property {string} target
 * @property {string} type
 */

/**
 * @typedef {Object} GoodsItem
 * @property {string} id
 * @property {string} name
 * @property {string} desc
 * @property {string} price
 * @property {string} picture
 * @property {number} orderNum
 */

/**
 * @typedef {Object} CategoryFloor
 * @property {string} id
 * @property {string} name
 * @property {string} picture
 * @property {string} saleInfo
 * @property {Array<{id: string, name: string, layer: number, parent: string|null}>} children
 * @property {GoodsItem[]} goods
 */

/**
 * 广告区域
 * @param {string} [distributionSite] 1 首页 / 2 分类页
 * @returns {Promise<Banner[]>}
 */
export function getBannerList(distributionSite = '1') {
  return request({ url: '/home/banner', data: { distributionSite } })
}

/**
 * 前台分类（首页宫格）
 * @returns {Promise<HomeCategory[]>}
 */
export function getHomeCategories() {
  return request({ url: '/home/category/mutli' })
}

/**
 * 热门推荐楼层入口
 * @returns {Promise<HotPanel[]>}
 */
export function getHotPanels() {
  return request({ url: '/home/hot/mutli' })
}

/**
 * 新鲜好物
 * @returns {Promise<GoodsItem[]>}
 */
export function getNewGoods() {
  return request({ url: '/home/new' })
}

/**
 * 分类楼层 + 楼层内商品
 * @returns {Promise<CategoryFloor[]>}
 */
export function getCategoryFloors() {
  return request({ url: '/home/goods' })
}