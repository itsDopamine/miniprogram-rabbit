// pages/login/index.js
// S4 实现真实登录；S0 只验证「来源页参数 + 回跳规则」
const { redirectAfterLogin } = require('../../utils/auth')

Page({
  data: {
    redirect: '',
  },

  onLoad(options) {
    const raw = (options && options.redirect) || ''
    let redirect = ''
    try {
      redirect = raw ? decodeURIComponent(raw) : ''
    } catch (err) {
      redirect = ''
    }
    this.setData({ redirect })
  },

  // 占位按钮：不写 token，只演示回跳规则（tabBar 页 switchTab，其余 redirectTo）
  mockSuccess() {
    redirectAfterLogin(this.data.redirect)
  },
})
