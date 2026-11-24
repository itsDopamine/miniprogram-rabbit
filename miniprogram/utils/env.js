// utils/env.js —— 环境与接口基地址
// 以小程序「运行版本」自动切换：开发版/体验版走 devtest，正式版走 prod
const DEV_BASE_URL = 'https://pcapi-xiaotuxian-front-devtest.itheima.net'
const PROD_BASE_URL = 'https://pcapi-xiaotuxian-front.itheima.net'

function getEnvVersion() {
  try {
    const info = wx.getAccountInfoSync()
    return (info && info.miniProgram && info.miniProgram.envVersion) || 'develop'
  } catch (err) {
    // 开发者工具个别版本取不到账号信息，按开发环境处理
    return 'develop'
  }
}

const envVersion = getEnvVersion()
const BASE_URL = envVersion === 'release' ? PROD_BASE_URL : DEV_BASE_URL

module.exports = {
  BASE_URL,
  envVersion,
}
