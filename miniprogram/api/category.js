import { request } from '../utils/request'

/**
 * 分类页商品条目
 * @typedef {Object} GoodsItem
 * @property {string} id
 * @property {string} name
 * @property {string} desc
 * @property {string} price
 * @property {string} picture
 * @property {number} orderNum
 */

/**
 * 二级分类，商品直接挂在它下面
 * @typedef {Object} CategoryChild
 * @property {string} id
 * @property {string} name
 * @property {string} picture
 * @property {GoodsItem[]} goods
 */

/**
 * 一级分类，children 是它的二级分类
 * @typedef {Object} CategoryTop
 * @property {string} id
 * @property {string} name
 * @property {string} picture
 * @property {string[]} imageBanners 实测恒为空数组
 * @property {CategoryChild[]} children
 */

/**
 * 一次返回「一级分类 → 二级分类 → 商品」整棵树，无分页参数
 * 2026-11-24 实测：9 个一级分类，商品合计约 350 条
 * @returns {Promise<CategoryTop[]>}
 */
export function getCategoryTop() {
  return request({ url: '/category/top' })
}
