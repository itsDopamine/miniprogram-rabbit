import { BASE_URL, SOURCE_CLIENT } from '../config/env'
import { getToken } from '../utils/auth'
import { request } from '../utils/request'

/**
 * 获取个人信息（必须登录）
 * @returns {Promise<Object>} id / avatar / nickname / account / gender / birthday / fullLocation / profession
 */
export function getProfile() {
  return request({ url: '/member/profile', auth: true })
}

/**
 * 修改个人信息
 * 响应里带新 token，调用方要写回 Storage
 * @param {{nickname?, gender?, birthday?, profession?, provinceCode?, cityCode?, countyCode?}} data
 */
export function updateProfile(data) {
  return request({ url: '/member/profile', method: 'PUT', data, auth: true, loading: true })
}

/**
 * 上传头像
 * wx.uploadFile 与 wx.request 有三处不同，所以不能套 request.js：
 * 1. content-type 必须是 multipart/form-data，boundary 由微信生成，手写会破坏它
 * 2. res.data 是字符串，要自己 JSON.parse
 * 3. 公共 header 要自己补
 * 表单字段名实测为 file：写成别的会返回 Required request part 'file' is not present
 * @param {string} filePath chooseAvatar 回调给的临时路径
 * @returns {Promise<{avatar: string}>}
 */
export function uploadAvatar(filePath) {
  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: BASE_URL + '/member/profile/avatar',
      filePath,
      name: 'file',
      header: { 'source-client': SOURCE_CLIENT, Authorization: getToken() },

      success(res) {
        if (res.statusCode === 401) {
          reject({ code: 401, msg: '未登录或登录已过期' })
          return
        }

        let body = null
        try {
          body = JSON.parse(res.data)
        } catch (err) {
          // 响应不是 JSON（网关报错页之类），按失败处理
          console.log('[upload] 响应解析失败', err)
        }

        if (!body || String(body.code) !== '1') {
          reject({
            code: body ? body.code : res.statusCode,
            msg: (body && (body.msg || body.message)) || '头像上传失败'
          })
          return
        }

        resolve(body.result)
      },

      fail(err) {
        reject({ code: -1, msg: err.errMsg || '头像上传失败' })
      }
    })
  })
}

/**
 * 收货地址列表
 * @returns {Promise<Array>}
 */
export function getAddressList() {
  return request({ url: '/member/address', auth: true })
}

/**
 * 收货地址详情
 * @param {string} id
 */
export function getAddressDetail(id) {
  return request({ url: `/member/address/${id}`, auth: true })
}

/**
 * 新增收货地址
 * isDefault 是 1/0，不是布尔
 */
export function addAddress(data) {
  return request({ url: '/member/address', method: 'POST', data, auth: true, loading: true })
}

/**
 * 修改收货地址
 * @param {string} id
 */
export function updateAddress(id, data) {
  return request({
    url: `/member/address/${id}`,
    method: 'PUT',
    data,
    auth: true,
    loading: true
  })
}

/**
 * 删除收货地址
 * @param {string} id
 */
export function deleteAddress(id) {
  return request({ url: `/member/address/${id}`, method: 'DELETE', auth: true, loading: true })
}
