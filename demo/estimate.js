// string number null undefined boolean
// array = array[any] array[string/number/null/undefined/boolean]
// enum range[e1, e2, e3]
// RegExp
// value
// interface=interfaceName?query
//

export default {
  // 'gulfstream/transaction/v1/core/pNewOrder': {
  //   use_form_v1: 'number',
  //   multddi_reqduire_product: {
  //     assert (param, ctx, inject) {
  //       let isString = ctx.getTypeOf(param) === 'String'
  //       switch (+inject.use_form_v1) {
  //         case 0:
  //         case 1:
  //           return !param || (isString && param.length === 0)
  //         case 2:
  //           let pJson = JSON.parse(param)
  //           let isMultiRequireProductItem = pJson.every(itm => {
  //             return (itm.hasOwnProperty('estimate_id') && itm.hasOwnProperty('product_category') && itm.hasOwnProperty('count_price_type'))
  //           })
  //           return isMultiRequireProductItem ? true : 'multi_require_product must contain: e.../p.../c...'
  //       }
  //     },
  //     provide: ['use_form_v1']
  //   }
  // },
  'gulfstream/transaction/v1/core/pNewOrder': {
    multi_require_product: {
      type: 'array[interface=estimateIdInterface]@pcToString&toJson',
      estimateIdInterface: {
        estimate_id: 'string',
        product_category: 'number|string',
        count_price_type: 'number'
      },
      pcToString (p) {
        return p.map(itm => {
          itm.product_category = itm.product_category + ''
          return itm
        })
      }
    }
  }
}
