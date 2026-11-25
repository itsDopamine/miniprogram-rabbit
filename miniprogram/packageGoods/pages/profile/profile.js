import { getProfile, updateProfile, uploadAvatar } from '../../../api/member'
import { setToken } from '../../../utils/auth'
import { toHttps } from '../../../utils/common'

const GENDERS = ['男', '女', '未知']
const UNKNOWN = GENDERS.length - 1

Page({
  data: {
    profile: { avatar: '', nickname: '', account: '', gender: '', birthday: '', profession: '' },
    genders: GENDERS,
    genderIndex: UNKNOWN,
    saving: false
  },

  onLoad() {
    this.fetchProfile()
  },

  async fetchProfile() {
    try {
      const profile = await getProfile()
      const hit = GENDERS.indexOf(profile.gender)

      this.setData({
        profile: {
          avatar: toHttps(profile.avatar),
          nickname: profile.nickname || '',
          account: profile.account || '',
          gender: profile.gender || '未知',
          birthday: profile.birthday || '',
          profession: profile.profession || ''
        },
        // 接口给的是「男/女/未知」，找不到就落到「未知」
        genderIndex: hit >= 0 ? hit : UNKNOWN
      })
    } catch (err) {
      console.log('[profile]', err)
    }
  },

  /* ---------- 头像 ---------- */

  async onChooseAvatar(e) {
    const filePath = e.detail.avatarUrl
    if (!filePath) return

    // 先顶上临时路径，让用户看到自己选的是哪张；失败再回滚
    const origin = this.data.profile.avatar
    this.setData({ 'profile.avatar': filePath })
    wx.showLoading({ title: '上传中', mask: true })

    try {
      const { avatar } = await uploadAvatar(filePath)
      wx.hideLoading()
      this.setData({ 'profile.avatar': toHttps(avatar) })
      wx.showToast({ title: '头像已更新', icon: 'success' })
    } catch (err) {
      wx.hideLoading()
      console.log('[profile] 头像上传失败', err)

      // 上传没成功就不能把临时路径留在界面上，否则用户以为已经换了
      this.setData({ 'profile.avatar': origin })

      // 服务端 OSS 失效时 msg 是「服务器内部错误」，对用户没意义，换成能看懂的话
      const msg = String(err.code) === '401' ? '登录已过期，请重新登录' : '头像上传暂不可用'
      wx.showToast({ title: msg, icon: 'none' })
    }
  },

  /* ---------- 其它字段 ---------- */

  // 输入过程中只记在 this 上：进 data 会多一轮重渲染，还会把光标顶到末尾
  onInput(e) {
    this[e.currentTarget.dataset.field] = e.detail.value
  },

  onGenderChange(e) {
    const genderIndex = Number(e.detail.value)
    this.setData({ genderIndex, 'profile.gender': GENDERS[genderIndex] })
  },

  onBirthdayChange(e) {
    this.setData({ 'profile.birthday': e.detail.value })
  },

  async onSave() {
    if (this.data.saving) return

    const profile = this.data.profile
    // this 上没有草稿说明没改过，退回接口原值
    const nickname = (this.nickname !== undefined ? this.nickname : profile.nickname).trim()
    const profession = (this.profession !== undefined ? this.profession : profile.profession).trim()

    if (!nickname) {
      wx.showToast({ title: '昵称不能为空', icon: 'none' })
      return
    }

    this.setData({ saving: true })

    try {
      const result = await updateProfile({
        nickname,
        gender: profile.gender || '未知',
        birthday: profile.birthday || null,
        profession
      })

      // Apifox 写了响应带 token，实测（2026-11-24）没有；留着兜底，别写死假设
      if (result && result.token) setToken(result.token)

      wx.showToast({ title: '已保存', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 600)
    } catch (err) {
      console.log('[profile] 保存失败', err)
    } finally {
      this.setData({ saving: false })
    }
  }
})
