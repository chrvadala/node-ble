const { Variant } = require('dbus-next')

const isVariant = o => o instanceof Variant

function parseDict (dict) {
  const o = {}
  for (const id in dict) {
    o[id] = isVariant(dict[id]) ? dict[id].value : dict[id]
  }
  return o
}

module.exports = parseDict
