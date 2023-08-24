import common from '../demo/common'
import estimate from '../demo/estimate'
import home from '../demo/home'
const rules = {
  ...home,
  ...common,
  ...estimate
}
import createApiParamCheckInstance from '../lib'
createApiParamCheckInstance(fetch, rules)
