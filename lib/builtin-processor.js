function toNumber (p) {
  if (typeof p !== 'number') return parseFloat(p)
  return p
}

function toJson (x) {
  return JSON.parse(x)
}

function toString (x) {
  if (typeof x === 'string') return x
  return JSON.stringify(x)
}

const builtInProcessors = {
  toNumber,
  toJson,
  toString
}

export default builtInProcessors
