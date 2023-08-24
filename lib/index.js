// assert (param, ctx, inject)

// value

// preProcessor @toJson&diyModifier1&modifier2&modifier3

// type =
// RegExp

// string number null undefined boolean enum

// enum enumRange[e1, e2, e3]

// interface=interfaceName

// array = array[any] array[string/number/null/undefined/boolean/interface=interfaceName]

import builtInProcessors from './builtin-processor'
import { BASIC_MAP } from './constants'
import { type, deepCopy, getBasicType } from './utils'
import { genAssertFailed, genRegExpTestFailed, genValueErr, genMethodErr, genTypeError } from './error-helper'

let timer = null

class RuleSet {
  constructor (xfetch, schema) {
    // 全局参数
    this.commonParams = schema['*']
    this.schema = schema
    this.errors = []
    this.queue = []

    this.utils = {
      getTypeOf: this.getTypeOf.bind(this)
    }

    this.doInterceptor(xfetch)
  }

  doInterceptor (xfetch) {
    if (!xfetch || !xfetch.interceptors) return console.error('no Xfetch instance or xfetch.interceptor is not defefined !')

    xfetch.interceptors.request.use((cfg) => {
      if (timer) clearTimeout(timer)

      timer = setTimeout(() => {
        this.queue.forEach(itm => this.exec(itm))
        this.queue.length = 0
        if (this.errors.length) {
          this.errorHander ? this.errorHander(this.errors) : console.error(this.errors)
        }
        this.errors = []
        timer = null
      }, 1000)

      // add into a queue for two factors
      // 1. this interceptor added too early to get params later added
      // 2. better performance, do not block xfetch request
      this.queue.push(cfg)
      return cfg
    })
  }

  addErrHandler (handler) {
    if (typeof handler !== 'function') {
      return console.error('the addErrHandler is not a function, fallback handler to console.error!')
    }
    this.errorHander = handler
  }

  splitTypeAndProcessor (schema) {
    if (schema.processors || /\[[^@]+@[^@]+\]/g.test(schema.type)) return
    let processors = /@([^?]+)/g.exec(schema.type)
    let s = processors && processors[1]?.split('&')
    if (s?.length) {
      schema.type = schema.type.replace(/@([^?]+)/g, '')
      schema.processors = s.map(p => {
        let ex
        if ((ex = (schema[p] || builtInProcessors[p])) && typeof ex === 'function') return ex
        console.warn(`${ex} pre-processor is not defined, which fallback to "(x) => x"`)
        return (noop) => noop
      })
      s = null
    }
  }

  getTypeOf (p) {
    return type(p)
  }

  testMethod (u, s, m) {
    // 检测 http 方法类型
    if (s.method && s.method.toLowerCase() !== m.toLowerCase()) {
      this.errors.push(genMethodErr(s, m))
    }
  }

  testValue (api, schema, key, value) {
    if (schema.value !== value) {
      this.errors.push(genValueErr(api, schema, key))
    }
  }

  testAssert (api, schema, key, val, inject) {
    // 调用断言
    let r = schema.assert(val, { api, ...this.utils }, inject)
    if (this.getTypeOf(r) === BASIC_MAP.boolean && r) return void 0
    else this.errors.push(genAssertFailed(api, schema, key, r))
  }

  preProcessor (schema, params) {
    // 预处理参数
    // 拿到类型@符号后面的方法名按照 & 拆开，
    // 从后向前调用，后一个的返回值作为下一个的入参
    let p = params
    let s = schema.processors
    if (s?.length) {
      p = s.reduceRight((pre, cur) => {
        try {
          return cur(pre)
        } catch (e) {
          console.warn('preProcessor calling failed and ignored, please check')
          return pre
        }
      }, params)
    }
    return p
  }

  testType (api, schema, key, value) {
    let type = schema.type

    // type enum
    if (type === 'enum' && !schema.enumRange?.includes(value)) {
      return this.errors.push(genTypeError(api, schema, key, value))
    }

    // type instanceof RegExp
    if (type instanceof RegExp && !type.test(value)) {
      return this.errors.push(genRegExpTestFailed(api, schema, key, value))
    }

    // not regExp
    let excludeProcessorExecResult = (/^[^@]+/g).exec(type)
    let typeWithoutPreProcessor = excludeProcessorExecResult ? excludeProcessorExecResult[0] : type
    let getBasic = getBasicType(typeWithoutPreProcessor)

    if (getBasic.length) {
      return !getBasic.includes(this.getTypeOf(value)) ? this.errors.push(genTypeError(api, schema, key, value)) : void 0
    } else {
      // complex type: array[type/any] / interface / array[interface]
      let interfaceReg = /^interface=([^@]+)/
      let arrayReg = /^array(?:\[([^\]]+)\])?/

      let interfaceResult = interfaceReg.exec(type)
      let interfaceName = interfaceResult ? interfaceResult[1] : ''

      let arrayResult = arrayReg.exec(type)
      let arrayResultDetail = arrayResult ? arrayResult[1] : ''

      if (interfaceName) {
        this.traverse(api, schema[interfaceName], value)
      } else if (arrayResult) {
        if (!Array.isArray(value)) {
          return this.errors.push(genTypeError(api, schema, key, value))
        }
        if (arrayResultDetail) {
          if (getBasicType(arrayResultDetail, 1)) {
            value.forEach((vItem, vIdx) => {
              let rebuiltKey = `${key}[${vIdx}]`
              let rebuiltSchema = {
                [rebuiltKey]: {
                  type: arrayResultDetail
                }
              }
              let rebuiltValue = {
                [rebuiltKey]: vItem
              }

              this.traverse(api, rebuiltSchema, rebuiltValue)
            })
          } else {
            // array[interface=someInterface]
            let tryInterfaceNameResult = interfaceReg.exec(arrayResultDetail)
            let interfaceName = tryInterfaceNameResult ? tryInterfaceNameResult[1] : ''
            if (interfaceName && schema[interfaceName]) {
              value.forEach((itm, idx) => this.traverse(api, schema[interfaceName], itm))
            } else {
              console.error(`cannot find ${interfaceName} on ${api} ${key} schema`)
            }
          }
        }
      }
    }
  }

  traverse (api, schema, finalParam) {
    for (let key in schema) {
      if (!schema.hasOwnProperty(key)) continue
      let keySchema = schema[key]
      let withoutTypeOrValue = ['type', 'value'].every((itm) => typeof keySchema[itm] === 'undefined')
      schema[key] = withoutTypeOrValue && !keySchema.assert ? { type: keySchema } : keySchema

      keySchema = schema[key]

      // simplify type
      this.splitTypeAndProcessor(keySchema)

      let keyParam = finalParam[key]

      // assert
      if (keySchema.assert) {
        // construct provide
        let provide = {}
        keySchema.provide?.forEach((k) => {
          provide[k] = finalParam[k]
        })
        this.testAssert(api, keySchema, key, keyParam, provide)
        continue
      }

      // 处理 value
      if (this.getTypeOf(keySchema.value) !== BASIC_MAP.undefined) {
        this.testValue(api, keySchema, key, keyParam)
        continue
      }

      // preProcessor before type check
      let processedParam = this.preProcessor(keySchema, keyParam)

      // type check
      this.testType(api, keySchema, key, processedParam)
    }
  }

  exec (cfg) {
    // 1. 校验方法
    // 2. 调用预处理器
    // 3. 开始匹配并收集错误
    let { url, method } = cfg
    let api = /https:\/\/(?:[a-zA-Z-.])+\/([^?]+)/g.exec(url)[1]
    let apiSchema = this.schema[api]
    if (!apiSchema) return cfg
    // mixin common params
    apiSchema = Object.assign({}, apiSchema, this.schema['*'])

    // match HTTP method
    this.testMethod(api, apiSchema, method)

    // deep cp params avoid polluting the origin
    let finalParam = deepCopy({ ...cfg.params, ...cfg.data })

    this.traverse(api, apiSchema, finalParam)
  }
}

export default function createApiParamCheckInstance (xfetch, apiSchema) {
  return new RuleSet(xfetch, apiSchema)
}
