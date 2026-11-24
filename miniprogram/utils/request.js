// utils/request.js —— 全项目唯一的网络请求入口
// 职责：拼基地址、注入 source-client/token、统一错误提示、401 单飞、loading 计数
const { BASE_URL } = require('./env')
const { showLoading, hideLoading, toast } = require('./feedback')
const { getToken } = require('./storage')
const { goLogin } = require('./auth')

// 并发请求同时 401 时，只跳一次登录页
let unauthorizedLock = false

function createError(message, extra) {
  const error = new Error(message)
  return Object.assign(error, extra || {})
}

function handleUnauthorized() {
  if (unauthorizedLock) return
  unauthorizedLock = true
  setTimeout(() => {
    unauthorizedLock = false
  }, 1500)

  toast('登录已过期，请重新登录')
  goLogin()
}

/**
 * @param {object} options
 * @param {string} options.url            接口路径，如 '/home/banner'
 * @param {'GET'|'POST'|'PUT'|'DELETE'} [options.method]
 * @param {object} [options.data]
 * @param {object} [options.header]
 * @param {boolean} [options.silent]      失败时不弹 toast（登录页等）
 * @param {boolean} [options.loading]     是否显示全局 loading
 * @param {number} [options.timeout]      超时毫秒，默认 10s
 * @returns {Promise<{code:any,msg:string,result:any}>}
 */
function request(options) {
  const {
    url,
    method = 'GET',
    data,
    header = {},
    silent = false,
    loading = false,
    timeout = 10000,
  } = options || {}

  const token = getToken()
  if (loading) showLoading()

  return new Promise((resolve, reject) => {
    wx.request({
      url: BASE_URL + url,
      method,
      data,
      timeout,
      header: Object.assign(
        {
          'source-client': 'miniapp',
        },
        // 上线前用 Apifox 确认是否需要 'Bearer ' 前缀，只改这一处
        token ? { Authorization: token } : {},
        header
      ),
      success(res) {
        if (res.statusCode === 401) {
          // 登录接口自身的 401（如密码错误）交给页面提示，不触发全局跳转
          if (String(url).indexOf('/login') === -1) {
            handleUnauthorized()
          }
          reject(createError('登录已过期', { statusCode: 401 }))
          return
        }

        if (res.statusCode < 200 || res.statusCode >= 300) {
          const body = res.data || {}
          const message = body.message || body.msg || `请求失败(${res.statusCode})`
          if (!silent) toast(message)
          reject(createError(message, { statusCode: res.statusCode, data: body }))
          return
        }

        // 先原样返回 { code, msg, result }，业务层自己取 result
        resolve(res.data)
      },
      fail(err) {
        const message = '网络异常，请稍后重试'
        if (!silent) toast(message)
        reject(createError(message, { statusCode: 0, error: err }))
      },
      complete() {
        if (loading) hideLoading()
      },
    })
  })
}

function get(url, data, options) {
  return request(Object.assign({}, options, { url, method: 'GET', data }))
}

function post(url, data, options) {
  return request(Object.assign({}, options, { url, method: 'POST', data }))
}

function put(url, data, options) {
  return request(Object.assign({}, options, { url, method: 'PUT', data }))
}

function del(url, data, options) {
  return request(Object.assign({}, options, { url, method: 'DELETE', data }))
}

module.exports = {
  request,
  get,
  post,
  put,
  del,
  BASE_URL,
}
