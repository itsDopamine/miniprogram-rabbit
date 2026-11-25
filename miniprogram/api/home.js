import { request } from '../utils/request'

/**
 * 广告区域
 * @typedef {Object} Banner
 * @property {string} id
 * @property {string} imgUrl
 * @property {string} hrefUrl
 * @property {string} type
 */

/**
 * @param {string} [distributionSite] 1 首页 / 2 分类页
 * @returns {Promise<Banner[]>}
 */
export function getBannerList(distributionSite = '1') {
  return request({ url: '/home/banner', data: { distributionSite } })
}

/**
 * 前台分类（首页宫格）
 * @typedef {Object} HomeCategory
 * @property {string} id
 * @property {string} name
 * @property {string} icon
 */

/**
 * @returns {Promise<HomeCategory[]>}
 */
export function getHomeCategories() {
  return request({ url: '/home/category/mutli' })
}

/**
 * 热门推荐楼层入口
 * @typedef {Object} HotPanel
 * @property {string} id
 * @property {string[]} pictures
 * @property {string} title
 * @property {string} alt
 * @property {string} target
 * @property {string} type
 */

/**
 * @returns {Promise<HotPanel[]>}
 */
export function getHotPanels() {
  return request({ url: '/home/hot/mutli' })
}

/**
 * 商品条目，楼层内商品也用它
 * @typedef {Object} GoodsItem
 * @property {string} id
 * @property {string} name
 * @property {string} desc
 * @property {string} price
 * @property {string} picture
 * @property {number} orderNum
 */

/**
 * 新鲜好物
 * @returns {Promise<GoodsItem[]>}
 */
export function getNewGoods() {
  return request({ url: '/home/new' })
}

/**
 * 分类楼层 + 楼层内商品
 * @typedef {Object} CategoryFloor
 * @property {string} id
 * @property {string} name
 * @property {string} picture
 * @property {string} saleInfo
 * @property {Array<{id: string, name: string, layer: number, parent: string|null}>} children
 * @property {GoodsItem[]} goods
 */

/**
 * @returns {Promise<CategoryFloor[]>}
 */
export function getCategoryFloors() {
  return request({ url: '/home/goods' })
}

/**
 * 猜你喜欢（真实分页接口）
 * @typedef {Object} GuessLikePage
 * @property {number} counts 总条数（实测 338）
 * @property {number} page 当前页
 * @property {number} pageSize 每页条数（默认 10）
 * @property {number} pages 总页数
 * @property {GoodsItem[]} items 商品列表
 */

/**
 * Apifox 只文档化了响应里的分页字段，没写请求参数；实测 ?page=2&pageSize=4 生效
 * @param {{page?: number, pageSize?: number}} [params]
 * @returns {Promise<GuessLikePage>}
 */
export function getGuessLike({ page = 1, pageSize = 10 } = {}) {
  return request({ url: '/home/goods/guessLike', data: { page, pageSize } })
}
