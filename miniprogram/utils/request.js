/**
 * utils/request.js —— wx.request 的 Promise 封装
 * 职责：拼 baseURL / 公共 header / 鉴权、统一判 code、统一 toast、401 续期与跳登录，只 resolve 业务 result
 */
import { BASE_URL, SOURCE_CLIENT } from '../config/env'
import { clearAuth, getToken, getUser, setToken } from './auth'

/** 业务成功码。实测接口返回字符串 '1'，React 版按 0 判断是错的 */
const SUCCESS_CODE = '1'

const LOGIN_PAGE = '/packageGoods/pages/login/login'

let loadingCount = 0
let redirecting = false
let refreshing = null

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

// 拼出当前页的完整路径，登录成功后按它回跳
function currentUrl() {
  const pages = getCurrentPages()
  const page = pages[pages.length - 1]
  if (!page) return ''

  const options = page.options || {}
  const query = Object.keys(options)
    .map((key) => `${key}=${options[key]}`)
    .join('&')

  return '/' + page.route + (query ? '?' + query : '')
}

// 并发 401 只处理一次：多个请求同时失败时连续跳转会叠出好几层登录页
function toLogin() {
  clearAuth()

  // 就在登录页上就不再跳，否则它自己的请求一失败就会被顶掉
  const page = getCurrentPages().pop()
  if (page && '/' + page.route === LOGIN_PAGE) return

  if (redirecting) return
  redirecting = true
  toast('请先登录')

  const from = currentUrl()
  wx.navigateTo({ url: LOGIN_PAGE + (from ? '?redirect=' + encodeURIComponent(from) : '') })

  setTimeout(() => {
    redirecting = false
  }, 2000)
}

/**
 * token 续期：用本地 user（account + id）换新 token
 *
 * 直接发底层请求而不走 api 层：api/* 全部 import 本文件，互相引用会成环。
 * 实测（2026-11-24）：该接口当前不可用——带 token 返回 401、不带返回 500，
 * 所以这里失败是常态，降级为「按未登录处理」，链路与改造前一致。
 * @returns {Promise<boolean>} 是否拿到了新 token
 */
function refreshAuth() {
  // 并发 401 只刷一次，其余请求等这一个结果
  if (refreshing) return refreshing

  const user = getUser()
  if (!user || !user.id || !user.account) return Promise.resolve(false)

  refreshing = new Promise((resolve) => {
    wx.request({
      url: BASE_URL + '/login/refresh',
      method: 'PUT',
      data: { account: user.account, id: String(user.id) },
      header: {
        'source-client': SOURCE_CLIENT,
        'content-type': 'application/json',
        Authorization: getToken()
      },

      success(res) {
        const body = res.data || {}
        const token = body.result && body.result.token

        if (res.statusCode === 200 && String(body.code) === SUCCESS_CODE && token) {
          setToken(token)
          resolve(true)
          return
        }

        resolve(false)
      },

      fail() {
        resolve(false)
      }
    })
  })

  // 结束后清掉进行中的标记，下一个 401 才能重新尝试
  refreshing = refreshing.then((ok) => {
    refreshing = null
    return ok
  })

  return refreshing
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
 * 实际发请求。retried 标记「这是续期后的重放」，防止 401 → 刷新 → 401 无限循环
 * @param {RequestOptions} options
 * @param {boolean} retried
 */
function send(options, retried) {
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
          // 带 token 的请求才有续期价值；从未登录过的 401 直接去登录页
          if (!retried && auth && getToken()) {
            refreshAuth().then((ok) => {
              if (!ok) {
                toLogin()
                reject({ code: 401, msg: '未登录或登录已过期' })
                return
              }

              // 拿到新 token，原样重放一次，结果接管当前 Promise
              send(options, true).then(resolve, reject)
            })
            return
          }

          toLogin()
          reject({ code: 401, msg: '未登录或登录已过期' })
          return
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

/**
 * @param {RequestOptions} options
 * @returns {Promise<any> & {abort: () => void}} 业务 result；失败 reject RequestError；abort() 可中途取消
 */
export function request(options) {
  return send(options, false)
}
