// 订单状态值来源级别 B：沿用 React 版，待 S7 实测确认
export const ORDER_STATE = Object.freeze({
  ALL: 0,
  UNPAID: 1,
  UNDELIVERED: 2,
  DELIVERED: 3,
  COMMENTED: 4,
  COMPLETED: 5,
  CANCELED: 6
})

export const ORDER_STATE_TEXT = Object.freeze({
  [ORDER_STATE.ALL]: '全部订单',
  [ORDER_STATE.UNPAID]: '待付款',
  [ORDER_STATE.UNDELIVERED]: '待发货',
  [ORDER_STATE.DELIVERED]: '待收货',
  [ORDER_STATE.COMMENTED]: '待评价',
  [ORDER_STATE.COMPLETED]: '已完成',
  [ORDER_STATE.CANCELED]: '已取消'
})