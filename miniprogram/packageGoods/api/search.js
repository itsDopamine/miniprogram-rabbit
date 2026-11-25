import { request } from '../../utils/request'

/**
 * 搜索提示语
 * @typedef {Object} SearchTip
 * @property {string[]} ids 关联关键词 id 集合
 * @property {string} associatedWord 联想词
 */

/**
 * 2026-11-24 实测：接口可用，但 dev 环境对任何关键词都返回空数组
 * 提示语失败不该打扰用户，用 silent 吞掉 toast
 * @param {string} keyword
 * @returns {Promise<SearchTip[]>}
 */
export function getSearchTips(keyword) {
  return request({ url: '/search/tips', data: { keyword }, silent: true })
}

/**
 * 商品搜索（带筛选与排序），2026-11-24 实测服务端 500（ES all shards failed）
 * @typedef {Object} SearchBody
 * @property {number} [page]
 * @property {number} [pageSize]
 * @property {string} [keyword]
 * @property {string[]} [associatedIds]
 * @property {string} [categoryId]
 * @property {string} [brandId]
 * @property {boolean} [onlyDiscount]
 * @property {'publishTime'|'orderNum'|'price'|'evaluateNum'} [sortField]
 * @property {'asc'|'desc'} [sortMethod]
 */

/**
 * @param {SearchBody} body
 * @returns {Promise<{conditions: Object, pageData: {counts: number, page: number, pageSize: number, pages: number, items: Object[]}}>}
 */
export function searchGoods(body) {
  return request({ url: '/search/all', method: 'POST', data: body })
}
