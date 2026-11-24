/**
 * utils/request.js —— wx.request 的 Promise 封装
 * 职责：拼 baseURL / 公共 header / 鉴权、统一判 code、统一 toast，只 resolve 业务 result
 */
import { BASE_URL, SOURCE_CLIENT } from '../config/env'
import { getToken, clearToken } from './auth'

/** 业务成功码。实测接口返回字符串 '1'，React 版按 0 判断是错的 */
const SUCCESS_CODE = '1'

let loadingCount = 0
let redirecting = false

// 并发请求共用一个 loading，计数归零才关
function showLoading() {
  loadingCount++
  if (loadingCount === 1) wx.showLoading({ title: '加载中', mask: true })
}

function hideLoading() {
  loadingCount--
  if (loadingCount <= 0) {
    loadingCount = 0
    wx.hideLoading()
  }
}

function toast(msg) {
  wx.showToast({ title: msg || '请求失败', icon: 'none' })
}

// 并发 401 只处理一次；登录页在 S5 接，这里先 toast 占位
function handleUnauthorized() {
  if (redirecting) return
  redirecting = true
  clearToken()
  toast('请先登录')
  setTimeout(() => {
    redirecting = false
  }, 2000)
}

/**
 * 请求参数
 * @typedef {Object} RequestOptions
 * @property {string} url 相对路径，如 '/home/banner'
 * @property {string} [method='GET']
 * @property {Object} [data] GET 会拼进 query，POST 作为 body
 * @property {boolean} [auth=false] 是否带 Authorization
 * @property {boolean} [loading=false] 是否显示全局 loading
 * @property {boolean} [silent=false] 是否吞掉失败 toast
 * @property {Object} [header] 追加/覆盖 header
 */

/**
 * 失败时 reject 的错误对象，不会再是裸 Error 或字符串
 * @typedef {Object} RequestError
 * @property {number|string} code 401 / HTTP 状态码 / 业务 code / -1 表示网络异常
 * @property {string} msg 可直接展示给用户的文案
 */

/**
 * @param {RequestOptions} options
 * @returns {Promise<any> & {abort: () => void}} 业务 result；失败 reject RequestError；abort() 可中途取消
 */
export function request(options) {
  const {
    url,
    method = 'GET',
    data,
    auth = false,
    loading = false,
    silent = false,
    header = {}
  } = options

  let requestTask = null

  const promise = new Promise((resolve, reject) => {
    if (loading) showLoading()

    requestTask = wx.request({
      url: BASE_URL + url,
      method,
      data,
      header: {
        'source-client': SOURCE_CLIENT,
        'content-type': 'application/json',
        ...(auth ? { Authorization: getToken() } : {}),
        ...header
      },

      success(res) {
        const { statusCode, data: body } = res

        if (statusCode === 401) {
          handleUnauthorized()
          return reject({ code: 401, msg: '未登录或登录已过期' })
        }

        if (statusCode < 200 || statusCode >= 300) {
          if (!silent) toast(`服务异常（${statusCode}）`)
          return reject({ code: statusCode, msg: `HTTP ${statusCode}` })
        }

        if (!body || String(body.code) !== SUCCESS_CODE) {
          const msg = (body && (body.msg || body.message)) || '请求失败'
          if (!silent) toast(msg)
          return reject({ code: body ? body.code : -1, msg })
        }

        resolve(body.result)
      },

      fail(err) {
        // 主动 abort 也走 fail，errMsg 含 "abort"；这不是网络异常，不能弹提示
        const aborted = (err.errMsg || '').indexOf('abort') >= 0
        if (!aborted && !silent) toast('网络异常，请稍后重试')
        reject({
          code: aborted ? 'abort' : -1,
          msg: aborted ? '请求已取消' : err.errMsg || '网络异常'
        })
      },

      complete() {
        if (loading) hideLoading()
      }
    })
  })

  // 只取消这一次请求，不影响其它并发请求
  promise.abort = () => {
    if (requestTask) requestTask.abort()
  }

  return promise
}
