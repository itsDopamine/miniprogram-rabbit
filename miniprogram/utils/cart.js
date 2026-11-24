/**
 * utils/cart.js —— 购物车的登录态分流
 *
 * 未登录：全部操作只动本地 Storage，不让用户一上来就被迫登录
 * 已登录：走 /member/cart 系列接口
 * 登录成功后：把本地条目一次性 merge 到服务端，成功才清本地
 *
 * 页面只认一种数据结构（见 normalize），不关心数据从哪来。
 */
import {
  addToCart,
  deleteCartItems,
  fetchCartList,
  mergeCart,
  setAllCartSelected,
  updateCartItem
} from '../api/cart'
import { getToken } from './auth'

const CART_KEY = 'rabbit_cart'

/* ---------- 本地读写 ---------- */

/**
 * 读本地购物车
 * @returns {Array} 恒为数组，Storage 为空时返回 []
 */
export function readLocalCart() {
  return wx.getStorageSync(CART_KEY) || []
}

function writeLocalCart(list) {
  wx.setStorageSync(CART_KEY, list)
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

  writeLocalCart(list)
  return list
}

export function clearLocalCart() {
  wx.removeStorageSync(CART_KEY)
}

/* ---------- 加购与合并 ---------- */

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
 * 合并失败时主动抛错且不清本地，等下次登录重试
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

/* ---------- 购物车页用的统一读写 ---------- */

/**
 * 把两套数据源的字段差异抹平，页面只面对这一种结构
 * - isEffective 必须用 !== false：游客条目没有这个字段，用 === true 会把整车判成失效
 * - stock / nowPrice 本地没有，分别兜底成 99 与加入时价格
 * - price 在不同接口里可能是 string 或 number，统一成数字给后面做乘法
 */
function normalize(item) {
  const price = Number(item.price) || 0
  const nowPrice = Number(item.nowPrice != null ? item.nowPrice : price) || 0

  return {
    ...item,
    price,
    nowPrice,
    priceText: nowPrice.toFixed(2),
    count: Number(item.count) || 1,
    selected: item.selected !== false,
    isEffective: item.isEffective !== false,
    stock: Number(item.stock) || 99
  }
}

/**
 * 取购物车列表：登录读接口，未登录读本地，返回结构一致
 * @returns {Promise<Array>}
 */
export async function getCartList() {
  if (!getToken()) {
    return readLocalCart().map(normalize)
  }

  const list = await fetchCartList()
  return (list || []).map(normalize)
}

/**
 * 改数量
 */
export async function updateCartCount(skuId, count) {
  if (!getToken()) {
    const list = readLocalCart()
    const item = list.find((i) => i.skuId === skuId)
    if (item) item.count = count
    writeLocalCart(list)
    return
  }

  await updateCartItem(skuId, { count })
}

/**
 * 单项勾选 / 取消
 */
export async function updateCartSelected(skuId, selected) {
  if (!getToken()) {
    const list = readLocalCart()
    const item = list.find((i) => i.skuId === skuId)
    if (item) item.selected = selected
    writeLocalCart(list)
    return
  }

  await updateCartItem(skuId, { selected })
}

/**
 * 全选 / 取消全选
 */
export async function updateAllSelected(selected) {
  if (!getToken()) {
    const list = readLocalCart()
    list.forEach((i) => {
      i.selected = selected
    })
    writeLocalCart(list)
    return
  }

  await setAllCartSelected(selected)
}

/**
 * 删除单品，ids 是 skuId 数组
 */
export async function removeCartItems(skuIds) {
  if (!getToken()) {
    const ids = skuIds || []
    writeLocalCart(readLocalCart().filter((i) => !ids.includes(i.skuId)))
    return
  }

  await deleteCartItems(skuIds)
}
