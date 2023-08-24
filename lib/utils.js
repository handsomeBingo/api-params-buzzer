import { BASIC_MAP } from './constants'

function type(a) {
  return Object.prototype.toString.call(a).slice(8, -1)
}

function deepCopy (obj) {
  if (!obj) throw Error('deepCopyErr: `obj` must be an object')
  let cp = new obj.constructor()
  for (let k in obj) {
    let cur = obj[k]
    let t = type(cur)
    switch (t) {
      case 'Array':
      case 'Object':
        cp[k] = deepCopy(cur)
        break
      case 'Function':
        cp[k] = cur
        break
      case 'RegExp':
        cp[k] = new RegExp(cur)
        break
      case 'Date':
        cp[k] = new Date(cur)
        break
      default:
        cp[k] = cur
    }
  }
  return cp
}

function getBasicType (type, checkOnly = 0) {
  let typeWithoutPreProcessor = type.match(/^[^@]+/g)
  let typeArray = typeWithoutPreProcessor && Array.isArray(typeWithoutPreProcessor) ? typeWithoutPreProcessor[0].split('|') : []
  let filtered = typeArray.map((t) => BASIC_MAP[t]).filter(tt => tt)
  if (checkOnly) return filtered.length
  return filtered
}

export {
  type,
  deepCopy,
  getBasicType
}
