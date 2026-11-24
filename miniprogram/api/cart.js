import { request } from '../utils/request'

/**
 * 加入购物车（必须登录）
 * 未登录服务端直接返回 HTTP 401（实测 body code 10019「token校验失败」），
 * 所以未登录场景不要调它，走 utils/cart.js 的本地暂存
 * @param {{skuId: string, count: number}} params
 * @returns {Promise<Object>} 该 sku 在购物车里的最新条目
 */
export function addToCart({ skuId, count }) {
  return request({
    url: '/member/cart',
    method: 'POST',
    data: { skuId, count },
    auth: true,
    loading: true
  })
}

/**
 * 合并购物车（必须登录）
 * Apifox 文档未收录此接口，实测存在（未登录返回 401 而非 404），
 * 请求体是数组，与 React 版 POST /member/cart/merge 的用法一致
 * @param {Array<{skuId: string, count: number, selected: boolean}>} list
 * @returns {Promise<Object>}
 */
export function mergeCart(list) {
  return request({
    url: '/member/cart/merge',
    method: 'POST',
    data: list,
    auth: true,
    loading: true
  })
}
