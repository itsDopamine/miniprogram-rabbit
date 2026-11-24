import { toHttps } from '../../utils/common'
import {
  buildDisabled,
  buildPathMap,
  buildSelectedText,
  findSku,
  isAvailable
} from '../../utils/sku'

Component({
  properties: {
    visible: { type: Boolean, value: false },
    specs: { type: Array, value: [] },
    skus: { type: Array, value: [] },
    // SPU 的默认价与首图，未选全时用它展示
    price: { type: String, value: '' },
    picture: { type: String, value: '' }
  },

  data: {
    selected: [],
    disabled: [],
    selectedText: '',
    skuPrice: '',
    skuPicture: '',
    skuStock: 0,
    count: 1,
    maxCount: 99
  },

  observers: {
    // 商品数据换了就重建字典并清空选择
    'specs, skus, price, picture': function (specs, skus, price, picture) {
      const list = skus || []

      this.skuList = list
      this.pathMap = buildPathMap(list)

      const selected = specs.map(() => '')

      this.setData({
        selected,
        disabled: buildDisabled(this.pathMap, specs, selected),
        selectedText: '',
        skuPrice: price,
        skuPicture: picture,
        skuStock: 0,
        count: 1,
        maxCount: 99
      })
    }
  },

  methods: {
    // 挂给遮罩的 catchtouchmove：吃掉手势，页面就不会跟着滚
    noop() {},

    onClose() {
      this.triggerEvent('visible-change', { visible: false })
    },

    onTapSpec(e) {
      const { specIndex, valueName } = e.currentTarget.dataset
      const index = Number(specIndex)
      const selectedBefore = this.data.selected
      const isSelected = selectedBefore[index] === valueName

      // 没选中的值要先确认可选；已选中的值永远可点（用来取消）
      if (
        !isSelected &&
        !isAvailable(this.pathMap, this.data.specs, selectedBefore, index, valueName)
      ) {
        return
      }

      // 先 slice：直接改 this.data.selected 属于原地修改，不触发渲染
      const selected = selectedBefore.slice()
      selected[index] = isSelected ? '' : valueName

      this.setData({
        selected,
        disabled: buildDisabled(this.pathMap, this.data.specs, selected),
        selectedText: buildSelectedText(this.data.specs, selected)
      })

      this.syncSku()
    },

    // 把当前 sku 的价格 / 图 / 库存同步到面板头部
    syncSku() {
      const sku = findSku(this.skuList, this.data.selected)

      if (!sku) {
        this.setData({
          skuPrice: this.data.price,
          skuPicture: this.data.picture,
          skuStock: 0,
          maxCount: 99
        })
        return
      }

      // 切到库存更少的 sku 时，之前加的数量可能超卖，必须重新夹取
      const count = Math.max(Math.min(this.data.count, sku.inventory), 1)

      this.setData({
        skuPrice: sku.price,
        skuPicture: toHttps(sku.picture) || this.data.picture,
        skuStock: sku.inventory,
        maxCount: sku.inventory,
        count
      })
    },

    onMinus() {
      if (this.data.count <= 1) return
      this.setData({ count: this.data.count - 1 })
    },

    onPlus() {
      const { count, maxCount } = this.data
      if (count >= maxCount) return
      this.setData({ count: count + 1 })
    },

    onConfirm() {
      const sku = findSku(this.skuList, this.data.selected)

      if (!sku) {
        wx.showToast({ title: '请选择完整规格', icon: 'none' })
        return
      }

      // 正常路径下点不到这里，兜一层防服务端数据异常
      if (sku.inventory <= 0) {
        wx.showToast({ title: '该规格暂时缺货', icon: 'none' })
        return
      }

      // 未登录要落本地暂存，所以把展示需要的字段一起抛给页面
      this.triggerEvent('confirm', {
        skuId: sku.id,
        count: this.data.count,
        price: sku.price,
        picture: toHttps(sku.picture) || '',
        attrsText: this.data.selectedText
      })
    }
  }
})
