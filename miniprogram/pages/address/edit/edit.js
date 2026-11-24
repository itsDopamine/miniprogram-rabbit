import { addAddress, getAddressDetail, updateAddress } from '../../../api/member'
import { ensureSingleDefault } from '../../../utils/address'
import { formatArea, getCodes, getColumns, getIndexes } from '../../../utils/area'

Page({
  data: {
    id: '',
    form: { receiver: '', contact: '', address: '', isDefault: false },
    indexes: [0, 0, 0],
    columns: [],
    areaText: '',
    // 本次编辑里用户有没有重新选过地区：没选过且是老地址，就沿用接口原 code
    areaPicked: false,
    saving: false
  },

  onLoad(options) {
    const indexes = [0, 0, 0]
    this.setData({ columns: getColumns(indexes) })

    if (options.id) {
      this.setData({ id: options.id })
      this.fetchDetail(options.id)
    }
  },

  async fetchDetail(id) {
    try {
      const detail = await getAddressDetail(id)
      const indexes = getIndexes(detail)
      const codes = getCodes(indexes)

      // 老数据可能是 2/4 位截断码，在区域表里查不到，只能显示接口给的 fullLocation
      const matched =
        codes.provinceCode === detail.provinceCode &&
        codes.cityCode === detail.cityCode &&
        codes.countyCode === detail.countyCode

      this.setData({
        form: {
          receiver: detail.receiver || '',
          contact: detail.contact || '',
          address: detail.address || '',
          isDefault: detail.isDefault === 1
        },
        indexes,
        columns: getColumns(indexes),
        areaText: matched ? formatArea(indexes) : detail.fullLocation || ''
      })
    } catch (err) {
      console.log('[address-edit]', err)
    }
  },

  /* ---------- 表单 ---------- */

  onInput(e) {
    this.setData({ [`form.${e.currentTarget.dataset.field}`]: e.detail.value })
  },

  // 滚动某一列时，它下级的列要跟着换候选
  onRegionColumnChange(e) {
    const indexes = this.data.indexes.slice()
    const { column, value } = e.detail
    indexes[column] = Number(value)

    // 省变了市和区归零，市变了区归零，否则下标可能越界
    if (column === 0) indexes[1] = 0
    if (column <= 1) indexes[2] = 0

    this.setData({ indexes, columns: getColumns(indexes) })
  },

  onRegionChange(e) {
    const indexes = e.detail.value.map(Number)
    this.setData({
      indexes,
      columns: getColumns(indexes),
      areaText: formatArea(indexes),
      areaPicked: true
    })
  },

  onDefaultChange(e) {
    this.setData({ 'form.isDefault': e.detail.value })
  },

  /* ---------- 保存 ---------- */

  async onSave() {
    if (this.data.saving) return

    const { id, form, indexes, areaPicked } = this.data

    if (!form.receiver.trim()) {
      wx.showToast({ title: '请填写收货人', icon: 'none' })
      return
    }
    if (!form.contact.trim()) {
      wx.showToast({ title: '请填写联系方式', icon: 'none' })
      return
    }
    if (!id && !areaPicked) {
      wx.showToast({ title: '请选择所在地区', icon: 'none' })
      return
    }
    if (!form.address.trim()) {
      wx.showToast({ title: '请填写详细地址', icon: 'none' })
      return
    }

    const payload = {
      receiver: form.receiver.trim(),
      contact: form.contact.trim(),
      address: form.address.trim(),
      isDefault: form.isDefault ? 1 : 0
    }

    // 只有用户重新选过地区才提交 code：老地址的 code 可能不在区域表里，
    // 无脑提交会拿默认下标把它覆盖成「北京市 东城区」
    if (!id || areaPicked) Object.assign(payload, getCodes(indexes))

    this.setData({ saving: true })

    try {
      const result = id ? await updateAddress(id, payload) : await addAddress(payload)
      const savedId = id || (result && result.id)

      if (payload.isDefault === 1 && savedId) {
        await ensureSingleDefault(savedId)
      }

      wx.showToast({ title: '已保存', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 600)
    } catch (err) {
      console.log('[address-edit] 保存失败', err)
    } finally {
      this.setData({ saving: false })
    }
  }
})
