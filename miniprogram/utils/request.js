import { BASE_URL, SOURCE_CLIENT } from '../config/env'
import { getToken, clearToken } from './auth'

let loadingCount = 0
let redirecting = false

const SUCCESS_CODE = '1'

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

// 并发 401 只跳一次；跳转在 S5 接登录页，这里先 toast 占位
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
 * @param {{url: string, method?: string, data?: object, auth?: boolean, loading?: boolean, silent?: boolean, header?: object}} options
 * @returns {Promise<any>} 业务 result
 */
export function request(options) {
  const { url, method = 'GET', data, auth = false, loading = false, silent = false, header = {} } = options

  return new Promise((resolve, reject) => {
    if (loading) showLoading()

    wx.request({
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

        // 实测：成功返回 code === '1'（字符串），与 React 版按 0 判断不一致
        if (!body || String(body.code) !== SUCCESS_CODE) {
          const msg = (body && (body.msg || body.message)) || '请求失败'
          if (!silent) toast(msg)
          return reject({ code: body ? body.code : -1, msg })
        }

        resolve(body.result)
      },

      fail(err) {
        if (!silent) toast('网络异常，请稍后重试')
        reject({ code: -1, msg: err.errMsg || '网络异常' })
      },

      complete() {
        if (loading) hideLoading()
      }
    })
  })
}

export default request