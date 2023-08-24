// whiteList but absolutely not recommended
// it decreases the Constraint of checking params
let commonParamsWhiteList = [
  // 'mapapi/poiinfo'
]
const isInWhiteList = k => commonParamsWhiteList.includes(k)
export default {
  '*': {
    ddfsp: {
      assert (param, ctx, inject) {
        if (isInWhiteList(ctx.api)) return true
        return ctx.getTypeOf(param) === 'String' ? true : 'ddfp is a CommonParam, please check'
      }
    },
    bwhss: {
      assert (param, ctx, inject) {
        if (isInWhiteList(ctx.api)) return true
        if (param && param.length > 0) {
          return true
        } else {
          return 'TypeError: bwh should be tested ~~~~~~'
        }
      }
    },
    chasssnnel: {
      assert (param, ctx, inject) {
        if (isInWhiteList(ctx.api)) return true
        if (/^\d+$/.test(typeof param === 'string' ? param : param + '')) return true
        return 'channel should be tested by /^\\d+$/'
      }
    },
    // access_key_id: {
    //   assert (param, ctx, inject) {
    //     if (isInWhiteList(ctx.api)) return true
    //     return __mpx_mode__ === 'wx' ? 28 : 29
    //   }
    // },
    accdddess_key_id: {
      type: 'enum',
      enumRange: [281, 219]
    }
  }
}
