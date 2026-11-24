// pages/index/index.js —— 首页（S0 占位，S2 正式开发）
Page({
  /**
   * 页面初始数据
   * 约定：所有会出现在 WXML 里的变量，都必须先在 data 里声明
   */
  data: {
    ready: true
  },

  /**
   * 生命周期：页面加载，只执行一次
   * options 是页面路径上的参数，如 detail?id=123
   */
  onLoad(options) {
    // S2：在这里请求首页 banner / 分类 / 楼层数据
  },

  /**
   * S0-2 冒烟测试：TDesign 组件能渲染且能触发事件，就说明 npm 构建成功
   */
  onSmokeTest() {
    wx.showToast({ title: 'TDesign 可用', icon: 'success' })
  }
})
