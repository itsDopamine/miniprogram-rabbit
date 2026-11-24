// 来源：接口文档 https://s.apifox.cn/0e6ee326-d646-41bd-9214-29dbf47648fa
// 注意：React 版生产域名写作 apipc-，与文档 pcapi- 不一致，以文档为准
const BASE_URL_DEV = 'https://pcapi-xiaotuxian-front-devtest.itheima.net'
const BASE_URL_PROD = 'https://pcapi-xiaotuxian-front.itheima.net'

export const SOURCE_CLIENT = 'miniapp'

const { envVersion } = wx.getAccountInfoSync().miniProgram

export const BASE_URL = envVersion === 'release' ? BASE_URL_PROD : BASE_URL_DEV