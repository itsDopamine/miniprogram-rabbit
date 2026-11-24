import { loginByPassword, loginByPhoneSimple, loginByWxMin } from '../../api/auth'
import { TAB_PAGES } from '../../config/constants'
import { setToken, setUser } from '../../utils/auth'
import { mergeLocalCart } from '../../utils/cart'

Page({
  data: {
    // redirect 由 401 拦截或「我的」页拼进来，登录成功后按它回跳
    redirect: '',
    loading: false,
    // 协议勾选：三条登录路径都要先过这一关
    agreed: false
  },

  onLoad(options) {
    if (options.redirect) {
      this.setData({ redirect: decodeURIComponent(options.redirect) })
    }
  },

  /* ---------- 三条登录路径的共同收尾 ---------- */

  async afterLogin(result) {
    setToken(result.token)
    // 记下 id + account：token 到期时靠它俩调 /login/refresh
    setUser({ id: result.id, account: result.account })

    await this.mergeCart()
    this.goBack()
  },

  // 合并失败不能拖垮登录：本地条目还在，下次登录会再试一次
  async mergeCart() {
    try {
      await mergeLocalCart()
    } catch (err) {
      console.log('[login] 合并购物车失败', err)
    }
  },

  goBack() {
    const pages = getCurrentPages()

    // 从被拦下的页面跳过来的，直接退回：那一页的 onShow 会带着新 token 重新取数
    if (pages.length > 1) {
      wx.navigateBack()
      return
    }

    // 栈里没有上一页（直接打开的登录页）才按 redirect 走
    const path = (this.data.redirect || '').split('?')[0]

    if (TAB_PAGES.indexOf(path) >= 0) {
      wx.switchTab({ url: path })
      return
    }

    if (path) {
      wx.redirectTo({ url: this.data.redirect })
      return
    }

    wx.switchTab({ url: '/pages/index/index' })
  },

  /* ---------- 表单交互 ---------- */

  onToggleAgree() {
    this.setData({ agreed: !this.data.agreed })
  },

  // 未勾选协议就不放行，返回 false 让调用方直接 return
  ensureAgreed() {
    if (this.data.agreed) return true
    wx.showToast({ title: '请先阅读并同意用户协议', icon: 'none' })
    return false
  },

  /* ---------- 微信手机号一键登录 ---------- */

  /**
   * 未勾选协议时按钮不带 open-type，点击只会走到这里；
   * 这样不会先弹一次微信授权面板再被拦下来
   */
  onWxBtnTap() {
    if (!this.data.agreed) {
      wx.showToast({ title: '请先阅读并同意用户协议', icon: 'none' })
    }
  },

  /**
   * open-type="getPhoneNumber" 的回调
   * 能拿到 encryptedData 才说明主体支持手机号快速验证；拿不到就引导用模拟登录，
   * 不要让用户反复点一个注定失败的按钮
   */
  async onGetPhoneNumber(e) {
    if (this.data.loading) return
    if (!this.ensureAgreed()) return

    const detail = e.detail || {}

    if (!detail.encryptedData || !detail.iv) {
      console.log('[login] getPhoneNumber 无 encryptedData', detail.errMsg)

      wx.showModal({
        title: '无法获取手机号',
        content:
          '当前小程序主体不支持手机号快速验证（或基础库只返回 code，需后端用 code 换手机号）。可改用手机号模拟登录。',
        confirmText: '模拟登录',
        success: (res) => {
          if (res.confirm) this.onPhoneSimple()
        }
      })
      return
    }

    this.setData({ loading: true })

    try {
      const result = await loginByWxMin({
        code: detail.code,
        encryptedData: detail.encryptedData,
        iv: detail.iv
      })
      await this.afterLogin(result)
    } catch (err) {
      // 失败文案由 request.js 统一 toast（如主体未授权时的业务报错）
      console.log('[login] 微信一键登录失败', err)
    } finally {
      this.setData({ loading: false })
    }
  },

  /**
   * 手机号模拟登录：走 /login/wxMin/simple
   * 实测可用（2026-11-24），只适合开发联调——服务端不校验手机号真实性
   */
  onPhoneSimple() {
    if (!this.ensureAgreed()) return

    wx.showModal({
      title: '手机号模拟登录',
      editable: true,
      placeholderText: '输入 11 位手机号',
      success: async (res) => {
        if (!res.confirm) return

        const phone = (res.content || '').trim()
        if (!/^1\d{10}$/.test(phone)) {
          wx.showToast({ title: '请输入 11 位手机号', icon: 'none' })
          return
        }

        this.setData({ loading: true })

        try {
          const result = await loginByPhoneSimple(phone)
          await this.afterLogin(result)
        } catch (err) {
          console.log('[login] 手机号模拟登录失败', err)
        } finally {
          this.setData({ loading: false })
        }
      }
    })
  },

  /* ---------- 账号密码登录 ---------- */

  // 输入过程中不 setData：账号密码不会被程序改写，没必要让它参与重渲染
  onInput(e) {
    this[e.currentTarget.dataset.field] = e.detail.value
  },

  async onSubmit() {
    // loading 兼作防连点：接口层还有全局遮罩，但遮罩生效前有极短窗口
    if (this.data.loading) return
    if (!this.ensureAgreed()) return

    const account = (this.account || '').trim()
    const password = this.password || ''

    if (!account || !password) {
      wx.showToast({ title: '请填写账号和密码', icon: 'none' })
      return
    }

    this.setData({ loading: true })

    try {
      const result = await loginByPassword({ account, password })
      await this.afterLogin(result)
    } catch (err) {
      // 失败文案由 request.js 统一 toast，这里只负责把按钮恢复可点
      console.log('[login]', err)
    } finally {
      this.setData({ loading: false })
    }
  }
})
