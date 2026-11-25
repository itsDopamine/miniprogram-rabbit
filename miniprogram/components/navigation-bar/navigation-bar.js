Component({
  options: {
    multipleSlots: true
  },

  properties: {
    title: { type: String, value: '' },
    back: { type: Boolean, value: true },
    background: { type: String, value: '#ffffff' },
    color: { type: String, value: '#1a1a1a' }
  },

  data: {
    statusBarHeight: 0,
    navHeight: 44,
    rightWidth: 0,
    canBack: false
  },

  lifetimes: {
    attached() {
      const { statusBarHeight, windowWidth } = wx.getWindowInfo()
      console.log('[nav]', wx.getWindowInfo())
      const menu = wx.getMenuButtonBoundingClientRect()
      console.log('[menu]', menu)

      // 导航条高 = 上间隙 + 胶囊高 + 下间隙，上下间隙相等
      const navHeight = menu && menu.height ? (menu.top - statusBarHeight) * 2 + menu.height : 44

      this.setData({
        statusBarHeight,
        navHeight,
        rightWidth: windowWidth - (menu ? menu.left : windowWidth),
        canBack: this.data.back && getCurrentPages().length > 1
      })
    }
  },

  methods: {
    onBack() {
      if (getCurrentPages().length > 1) {
        wx.navigateBack()
      } else {
        wx.switchTab({ url: '/pages/index/index' })
      }
      this.triggerEvent('back')
    }
  }
})
