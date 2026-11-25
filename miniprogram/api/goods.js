import { request } from '../utils/request'

/**
 * 商品详情
 * @param {string} id 商品 id。从列表页 URL 带过来，恒为字符串
 * @returns {Promise<Object>} 含 specs / skus / details 的完整商品对象
 */
export function getGoodsDetail(id) {
  // GET 的 data 由 request.js 拼进 query，不用自己写 ?id=
  return request({ url: '/goods', data: { id } })
}
