Component({
  properties: {
    // 直接传接口返回的商品对象，组件内只读不改
    goods: { type: Object, value: {} },
    // grid：图在上；row：图在左，用于购物车/订单列表
    layout: { type: String, value: 'grid' }
  },

  methods: {
    onTap() {
      // 事件名必须全小写，驼峰会被静默吞掉
      this.triggerEvent('tap-card', { id: this.data.goods.id })
    }
  }
})
