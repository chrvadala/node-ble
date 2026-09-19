const { Variant } = require('dbus-native')

/**
 * DBus value wrappers used across BlueZ interfaces.
 */
class BusTypes {
  /**
     * Create a DBus signed 16-bit variant value.
     * @param {number} value - The 16-bit integer value to wrap.
     * @returns {import('dbus-native').Variant} A DBus variant carrying a signed 16-bit integer.
     */
  static uint16 (value) {
    return new Variant('q', value)
  }
}

module.exports = BusTypes
