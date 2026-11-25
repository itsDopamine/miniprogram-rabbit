import { deleteAddress, getAddressList, updateAddress } from '../../../../api/member'
import { ensureSingleDefault } from '../../../utils/address'

Page({
  data: {
    list: [],
    // 结算页以 ?select=1 打开时，点条目是「选中」而不是「编辑」
    selectMode: false,
    loading: true,
    error: ''
  },

  onLoad(options) {
    this.setData({ selectMode: options.select === '1' })
  },

  onShow() {
    this.fetchList()
  },

  /**
   * 选择模式：把地址回传给打开方（结算页），然后退回
   * eventChannel 随页面实例存在，不会把这次选择留到下一次结算
   */
  onTapItem(e) {
    if (!this.data.selectMode) return

    const item = this.data.list.find((i) => i.id === e.currentTarget.dataset.id)
    if (!item) return

    const channel = this.getOpenerEventChannel()
    if (channel && channel.emit) channel.emit('select', item)

    wx.navigateBack()
  },

  async fetchList() {
    this.setData({ loading: true, error: '' })

    try {
      const list = await getAddressList()
      // 默认地址置顶：接口返回顺序不含默认信息
      const sorted = (list || [])
        .slice()
        .sort((a, b) => Number(b.isDefault === 1) - Number(a.isDefault === 1))
      this.setData({ list: sorted, loading: false })
    } catch (err) {
      console.log('[address-list]', err)
      this.setData({ loading: false, error: '加载失败，请稍后重试' })
    }
  },

  onAdd() {
    wx.navigateTo({ url: '/packageGoods/pages/address/edit/edit' })
  },

  // 操作区用 catchtap 挂它，避免点按钮时连带触发「选中地址」
  noop() {},

  onEdit(e) {
    wx.navigateTo({
      url: `/packageGoods/pages/address/edit/edit?id=${e.currentTarget.dataset.id}`
    })
  },

  async onSetDefault(e) {
    const id = e.currentTarget.dataset.id
    const item = this.data.list.find((i) => i.id === id)
    if (!item || item.isDefault === 1 || this.settingDefault) return

    this.settingDefault = true

    try {
      await updateAddress(id, { isDefault: 1 })
      await ensureSingleDefault(id)
      await this.fetchList()
      wx.showToast({ title: '已设为默认', icon: 'none' })
    } catch (err) {
      console.log('[address-list] 设默认失败', err)
      this.fetchList()
    } finally {
      this.settingDefault = false
    }
  },

  onDelete(e) {
    const id = e.currentTarget.dataset.id

    wx.showModal({
      title: '提示',
      content: '确定要删除这个收货地址吗？',
      confirmColor: '#cf4444',
      success: (res) => {
        if (res.confirm) this.doDelete(id)
      }
    })
  },

  async doDelete(id) {
    try {
      await deleteAddress(id)
      this.fetchList()
    } catch (err) {
      console.log('[address-list] 删除失败', err)
    }
  },

  onRetry() {
    this.fetchList()
  }
})
