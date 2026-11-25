import { MAX_CART_COUNT } from '../../config/constants'
import { clampCount, toHttps } from '../../utils/common'
import {
  buildDisabled,
  buildPathMap,
  buildSelectedText,
  countLimit,
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
    maxCount: MAX_CART_COUNT
  },

  observers: {
    // 商品数据换了就重建字典并清空选择
    'specs, skus, price, picture': function (specs, skus, price, picture) {
      const list = skus || []

      this.skuList = list
      this.pathMap = buildPathMap(list)

      this.initState(specs, price, picture)
    }
  },

  methods: {
    // 把面板恢复到「什么都没选」的状态
    initState(specs, price, picture) {
      const selected = specs.map(() => '')

      this.setData({
        selected,
        disabled: buildDisabled(this.pathMap || {}, specs, selected),
        selectedText: '',
        skuPrice: price,
        skuPicture: picture,
        skuStock: 0,
        count: 1,
        maxCount: MAX_CART_COUNT
      })
    },

    // 加购成功后由页面调用：下次打开是干净的，不残留上次的规格与数量
    reset() {
      this.initState(this.data.specs, this.data.price, this.data.picture)
    },

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
          maxCount: MAX_CART_COUNT
        })
        return
      }

      const limit = countLimit(sku)
      // 切到库存更少的 sku 时，之前加的数量可能超卖，必须重新夹取
      const count = Math.max(Math.min(Number(this.data.count) || 1, limit), 1)

      this.setData({
        skuPrice: sku.price,
        skuPicture: toHttps(sku.picture) || this.data.picture,
        skuStock: sku.inventory,
        maxCount: limit,
        count
      })
    },

    onMinus() {
      // Number()：置空重填的那一帧 count 是 ''，直接减会得到 -1
      const count = Number(this.data.count) || 1
      if (count <= 1) return
      this.setData({ count: count - 1 })
    },

    // 输入过程中不进 data：每敲一个字都 setData 会把光标顶到末尾
    onCountInput(e) {
      this.inputCount = e.detail.value
    },

    onCountBlur() {
      // 回车会先触发 confirm 再触发 blur，两次都进会把 count 刷成空
      if (this.blurLock) return
      this.blurLock = true
      setTimeout(() => {
        this.blurLock = false
      }, 0)

      // 非法输入（空串、字母）返回 null，退回原值；其余夹到 [1, maxCount]
      const parsed = clampCount(this.inputCount, this.data.maxCount)
      this.inputCount = undefined

      const count = parsed === null ? Number(this.data.count) || 1 : parsed

      // input 不是严格受控：先置空再回填，强制它跟随 data
      this.setData({ count: '' }, () => {
        this.setData({ count })
      })
    },

    onPlus() {
      // Number()：count 在置空那一帧是 ''，'' + 1 会变成字符串 '1'，再点就成 '11'
      const count = Number(this.data.count) || 1
      if (count >= this.data.maxCount) return
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

      // 提交前再夹一次：输入框里可能有没失焦的值，库存也可能刚被刷新过
      const count = clampCount(this.data.count, countLimit(sku)) || 1

      // 未登录要落本地暂存，stock 也得带上，否则本地购物车查不到真实库存
      this.triggerEvent('confirm', {
        skuId: sku.id,
        count,
        price: sku.price,
        picture: toHttps(sku.picture) || '',
        attrsText: this.data.selectedText,
        stock: sku.inventory
      })
    }
  }
})
