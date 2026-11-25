/**
 * utils/address.js —— 地址的业务约束
 */
import { getAddressList, updateAddress } from '../api/member'

/**
 * 保证「默认地址唯一」
 * 服务端在设置新默认时会不会自动把旧的置 0，2026-11-24 未验证；
 * 前端兜一层：设完默认重拉列表，还有别的 1 就逐个改回 0
 * @param {string} keepId 要保留为默认的地址 id
 * @returns {Promise<number>} 被改回非默认的条数
 */
export async function ensureSingleDefault(keepId) {
  const list = (await getAddressList()) || []
  const others = list.filter((item) => item.id !== keepId && item.isDefault === 1)

  for (const item of others) {
    await updateAddress(item.id, { isDefault: 0 })
  }

  return others.length
}
