/**
 * utils/cart.js —— 购物车的登录态分流与本地暂存
 *
 * 未登录：加购只写本地，不让用户一上来就被迫登录
 * 登录成功后：把本地条目一次性 merge 到服务端，成功才清本地
 *
 * 本地条目字段与 React 版保持一致：
 * { id, name, picture, price, count, skuId, attrsText, selected }
 */
import { addToCart, mergeCart } from '../api/cart'
import { getToken } from './auth'

const CART_KEY = 'rabbit_cart'

/**
 * 读本地购物车
 * @returns {Array} 恒为数组，Storage 为空时返回 []
 */
export function readLocalCart() {
  return wx.getStorageSync(CART_KEY) || []
}

/**
 * 本地加购：同 sku 累加数量，新条目默认选中
 * @param {Object} item
 * @returns {Array} 写入后的完整列表
 */
export function appendLocalCart(item) {
  const list = readLocalCart()
  const exist = list.find((i) => i.skuId === item.skuId)

  if (exist) {
    exist.count += item.count || 1
  } else {
    list.push({ ...item, selected: true })
  }

  wx.setStorageSync(CART_KEY, list)
  return list
}

export function clearLocalCart() {
  wx.removeStorageSync(CART_KEY)
}

/**
 * 加购入口：有 token 走服务端，没有就落本地
 * @param {{id, name, picture, price, count, skuId, attrsText}} item
 * @returns {Promise<'server'|'local'>} 数据最终落在哪
 */
export async function addGoodsToCart(item) {
  if (!getToken()) {
    appendLocalCart(item)
    return 'local'
  }

  await addToCart({ skuId: item.skuId, count: item.count })
  return 'server'
}

/**
 * 登录成功后调用：把本地购物车合并进服务端
 * 合并失败时主动抛错且不清本地，等下次登录重试——
 * React 版在这里只 warn 然后继续拉服务端列表，本地条目会被直接覆盖掉
 * @returns {Promise<number>} 合并掉的条目数，0 表示本地是空的
 */
export async function mergeLocalCart() {
  const list = readLocalCart()
  if (!list.length) return 0

  const payload = list.map(({ skuId, count, selected }) => ({ skuId, count, selected }))

  await mergeCart(payload)
  clearLocalCart()
  return payload.length
}
