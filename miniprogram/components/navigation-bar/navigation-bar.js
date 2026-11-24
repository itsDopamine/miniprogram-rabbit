// components/navigation-bar/navigation-bar.js
Component({
  options: {
    multipleSlots: true // 在组件定义时的选项中启用多 slot 支持
  },

  /**
   * 组件的属性列表（由父页面传入，类似 React 的 props）
   */
  properties: {
    extClass: {
      type: String,
      value: ''
    },
    title: {
      type: String,
      value: ''
    },
    background: {
      type: String,
      value: ''
    },
    color: {
      type: String,
      value: ''
    },
    back: {
      type: Boolean,
      value: true
    },
    loading: {
      type: Boolean,
      value: false
    },
    homeButton: {
      type: Boolean,
      value: false
    },
    animated: {
      // 显示隐藏的时候 opacity 动画效果
      type: Boolean,
      value: true
    },
    show: {
      // 显示隐藏导航，隐藏的时候导航栏的高度占位还在
      type: Boolean,
      value: true,
      observer: '_showChange'
    },
    // back 为 true 的时候，返回的页面深度
    delta: {
      type: Number,
      value: 1
    }
  },

  /**
   * 组件的初始数据（内部状态，只能通过 setData 修改）
   */
  data: {
    displayStyle: ''
  },

  lifetimes: {
    attached() {
      // 胶囊按钮位置：用来算导航栏左右留白，避免标题被胶囊挡住
      const rect = wx.getMenuButtonBoundingClientRect()
      // 新版 API：getWindowInfo / getDeviceInfo 取代了已废弃的 getSystemInfo
      const windowInfo = wx.getWindowInfo()
      const deviceInfo = wx.getDeviceInfo()

      const isAndroid = deviceInfo.platform === 'android'
      const isDevtools = deviceInfo.platform === 'devtools'

      this.setData({
        ios: !isAndroid,
        innerPaddingRight: `padding-right: ${windowInfo.windowWidth - rect.left}px`,
        leftWidth: `width: ${windowInfo.windowWidth - rect.left}px`,
        safeAreaTop:
          isDevtools || isAndroid
            ? `height: calc(var(--height) + ${windowInfo.safeArea.top}px); padding-top: ${windowInfo.safeArea.top}px`
            : ''
      })
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    _showChange(show) {
      const animated = this.data.animated
      let displayStyle = ''
      if (animated) {
        displayStyle = `opacity: ${show ? '1' : '0'};transition:opacity 0.5s;`
      } else {
        displayStyle = `display: ${show ? '' : 'none'}`
      }
      this.setData({ displayStyle })
    },

    back() {
      const data = this.data
      if (data.delta) {
        wx.navigateBack({ delta: data.delta })
      }
      // 事件名必须全小写，父组件用 bind:back 监听
      this.triggerEvent('back', { delta: data.delta }, {})
    }
  }
})
