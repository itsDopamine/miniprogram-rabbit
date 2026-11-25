import debounce from 'lodash.debounce'
import { getSearchTips, searchGoods } from '../../api/search'
import { toHttps } from '../../utils/common'

const HISTORY_KEY = 'search:history'
const HISTORY_MAX = 10
const PAGE_SIZE = 10

// 综合与销量点一次就定，价格再点一次切升降序
const SORTS = [
  { label: '综合', field: 'publishTime', method: 'desc' },
  { label: '销量', field: 'orderNum', method: 'desc' },
  { label: '价格', field: 'price', method: 'asc' }
]

Page({
  data: {
    statusBarHeight: 0,
    navHeight: 44,
    rightWidth: 96,
    keyword: '',
    tips: [],
    history: [],

    sorts: SORTS.map((item) => item.label),
    searched: false,
    list: [],
    page: 1,
    hasMore: true,
    loading: false,
    error: '',
    sortIndex: 0,
    sortField: SORTS[0].field,
    sortMethod: SORTS[0].method
  },

  onLoad() {
    this.initLayout()
    this.setData({ history: wx.getStorageSync(HISTORY_KEY) || [] })

    // 停止输入 300ms 才真正请求；bind 不能省，debounce 调用时 this 是 undefined
    this.fetchTips = debounce(this.requestTips.bind(this), 300)
  },

  // 包 try：任何一个环境 API 抛错都不该让后面的初始化全部中断
  initLayout() {
    let statusBarHeight = 0
    let navHeight = 44
    let rightWidth = 96

    try {
      const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
      const windowWidth = info.windowWidth || 375
      statusBarHeight = info.statusBarHeight || 0

      const menu = wx.getMenuButtonBoundingClientRect()
      // 胶囊坐标在个别环境返回全 0，此时沿用上面的默认值，否则标题会被挤成 0 宽度
      if (menu && menu.height > 0 && menu.left > 0 && menu.left < windowWidth) {
        navHeight = (menu.top - statusBarHeight) * 2 + menu.height
        rightWidth = windowWidth - menu.left
      }
    } catch (e) {
      console.log('[search] 布局参数获取失败，使用默认值', e)
    }

    this.setData({ statusBarHeight, navHeight, rightWidth })
  },

  onUnload() {
    // 不取消的话，页面销毁后回调仍会执行并 setData，报 setData on destroyed page
    this.fetchTips.cancel()
    if (this.tipsRequest) this.tipsRequest.abort()
    if (this.listRequest) this.listRequest.abort()
  },

  /* ---------- 提示语 ---------- */

  async requestTips() {
    const keyword = this.data.keyword.trim()
    if (!keyword) return

    // 先取消上一次在途请求（省流量、减轻服务端压力）
    if (this.tipsRequest) this.tipsRequest.abort()

    const req = getSearchTips(keyword)
    this.tipsRequest = req

    try {
      const tips = await req
      // abort 是尽力而为：响应可能已排进回调队列，仍要用引用比对兜底
      if (this.tipsRequest !== req) return
      this.setData({ tips })
    } catch (e) {
      if (e.code === 'abort' || this.tipsRequest !== req) return
      this.setData({ tips: [] })
    }
  },

  onInput(e) {
    const keyword = e.detail.value
    // 改词就退出结果视图，回到提示语
    this.setData({ keyword, searched: false, tips: [] })

    if (!keyword.trim()) {
      this.fetchTips.cancel()
      return
    }

    this.fetchTips()
  },

  onConfirm(e) {
    this.doSearch(e.detail.value)
  },

  onTapTip(e) {
    this.doSearch(e.currentTarget.dataset.word)
  },

  onTapHistory(e) {
    this.doSearch(e.currentTarget.dataset.word)
  },

  onClear() {
    this.fetchTips.cancel()
    this.setData({ keyword: '', tips: [], searched: false })
  },

  onClearHistory() {
    wx.removeStorageSync(HISTORY_KEY)
    this.setData({ history: [] })
  },

  /* ---------- 搜索结果 ---------- */

  doSearch(word) {
    const keyword = String(word || '').trim()
    if (!keyword) return

    // 去重后新的在前，超出上限截断
    const history = [keyword, ...this.data.history.filter((item) => item !== keyword)].slice(
      0,
      HISTORY_MAX
    )
    wx.setStorageSync(HISTORY_KEY, history)

    this.setData({
      keyword,
      history,
      tips: [],
      searched: true,
      list: [],
      page: 1,
      hasMore: true,
      error: ''
    })

    this.fetchList(true)
  },

  /**
   * @param {boolean} reset true 表示从第 1 页重来（切排序、重试）
   */
  async fetchList(reset) {
    if (this.listLoading) return
    if (!reset && !this.data.hasMore) return

    const page = reset ? 1 : this.data.page + 1

    if (this.listRequest) this.listRequest.abort()
    const req = searchGoods({
      page,
      pageSize: PAGE_SIZE,
      keyword: this.data.keyword.trim(),
      sortField: this.data.sortField,
      sortMethod: this.data.sortMethod
    })
    this.listRequest = req

    this.listLoading = true
    this.setData({ loading: true, error: '' })

    try {
      const res = await req
      if (this.listRequest !== req) return

      const items = res.pageData.items.map((item) => ({ ...item, picture: toHttps(item.picture) }))

      this.setData({
        list: reset ? items : this.data.list.concat(items),
        page: res.pageData.page,
        // 用接口返回的 pages 判断，不自己猜
        hasMore: res.pageData.page < res.pageData.pages
      })
    } catch (e) {
      if (e.code === 'abort' || this.listRequest !== req) return
      this.setData({ error: '搜索失败，请稍后重试' })
    } finally {
      if (this.listRequest === req) {
        this.listLoading = false
        this.setData({ loading: false })
      }
    }
  },

  onLoadMore() {
    if (this.data.searched && !this.data.loading && this.data.hasMore) this.fetchList(false)
  },

  onRetry() {
    this.fetchList(true)
  },

  onTapSort(e) {
    const index = Number(e.currentTarget.dataset.index)
    const sort = SORTS[index]
    if (!sort) return

    // 价格再点一次切升降序，其它两项点一次就定
    let method = sort.method
    if (index === 2 && this.data.sortIndex === 2) {
      method = this.data.sortMethod === 'asc' ? 'desc' : 'asc'
    }

    // 条件变了就必须回第 1 页，否则新排序下的第 N 页会和旧列表串在一起
    this.setData({
      sortIndex: index,
      sortField: sort.field,
      sortMethod: method,
      list: [],
      page: 1,
      hasMore: true,
      error: ''
    })

    this.fetchList(true)
  },

  onTapGoods(e) {
    wx.navigateTo({ url: `/packageGoods/pages/goods/detail/detail?id=${e.detail.id}` })
  },

  onCancel() {
    wx.navigateBack()
  }
})
