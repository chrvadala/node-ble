const { Variant } = require('dbus-next')

function buildTypedValue (type, value) {
  const dbusType = MAPPINGS[type]
  if (!dbusType) throw new Error('Unrecognized type')

  return new Variant(dbusType, value)
}

module.exports = buildTypedValue

// https://dbus.freedesktop.org/doc/dbus-specification.html
const MAPPINGS = {
  string: 's',
  int16: 'n',
  boolean: 'b',
  uint16: 'q',
  dict: 'e'
}
