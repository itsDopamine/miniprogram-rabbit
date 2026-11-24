import { loginByPassword } from '../../api/auth'
import { TAB_PAGES } from '../../config/constants'
import { setToken, setUser } from '../../utils/auth'
import { mergeLocalCart } from '../../utils/cart'

Page({
  data: {
    // redirect 由 401 拦截或「我的」页拼进来，登录成功后按它回跳
    redirect: '',
    loading: false
  },

  onLoad(options) {
    if (options.redirect) {
      this.setData({ redirect: decodeURIComponent(options.redirect) })
    }
  },

  // 输入过程中不 setData：账号密码不会被程序改写，没必要让它参与重渲染
  onInput(e) {
    this[e.currentTarget.dataset.field] = e.detail.value
  },

  async onSubmit() {
    // loading 兼作防连点：接口层还有全局遮罩，但遮罩生效前有极短窗口
    if (this.data.loading) return

    const account = (this.account || '').trim()
    const password = this.password || ''

    if (!account || !password) {
      wx.showToast({ title: '请填写账号和密码', icon: 'none' })
      return
    }

    this.setData({ loading: true })

    try {
      const result = await loginByPassword({ account, password })

      setToken(result.token)
      // 记下 id + account：token 到期时靠它俩调 /login/refresh
      setUser({ id: result.id, account: result.account })

      await this.mergeCart()
      this.goBack()
    } catch (err) {
      // 失败文案由 request.js 统一 toast，这里只负责把按钮恢复可点
      console.log('[login]', err)
    } finally {
      this.setData({ loading: false })
    }
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
  }
})
