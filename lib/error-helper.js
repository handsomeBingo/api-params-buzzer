import { AF, ME, RF, TE, VE } from './constants'
import { type } from './utils'

const genMethodErr = (u, s, m) => ({
  type: ME,
  api: u,
  method: m,
  msg: `Unexpected ${ME}: schema requires "${s.method}" instead!`
})

const genValueErr = (u, s, p) => ({
  type: VE,
  api: u,
  paramKey: p,
  msg: `Unexpected ${VE}: value is not equal with "${s.value}"!`
})

const genAssertFailed = (u, s, p, e) => ({
  type: AF,
  api: u,
  paramKey: p,
  msg: `Unexpected ${AF}: schema.assert failed! ${e && type(e) !== 'String' ? JSON.stringify(e) : e}`
})

const genRegExpTestFailed = (u, s, key, value) => ({
  type: RF,
  api: u,
  paramKey: key,
  paramVal: value,
  msg: `Unexpected ${RF}: ${s.type.toString()} tests parma failed!`
})

const genTypeError = (u, s, pn, pv) => ({
  type: TE,
  api: u,
  paramKey: pn,
  paramVal: pv,
  msg: `Unexpected ${TE}: cannot assign to the "${s.type}" type!`
})

export {
  genTypeError,
  genMethodErr,
  genValueErr,
  genRegExpTestFailed,
  genAssertFailed
}
