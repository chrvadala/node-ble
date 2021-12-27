const { systemBus: createSystemBus } = require('dbus-next')
const Bluetooth = require('./Bluetooth')

/**
   * @typedef {Object} NodeBleSession
   * @property {Bluetooth} bluetooth - Bluetooth session
   * @property {func} destroy - Close bluetooth session
*/

/**
 * @function createBluetooth
 * @description Init bluetooth session and return
 * @returns {NodeBleInit}
 * @example
 * const { createBluetooth } = require('node-ble')
 *
 * async function main () {
 *  const { bluetooth, destroy } = createBluetooth()
 *  const adapter = await bluetooth.defaultAdapter()
 *  // do here your staff
 *  destroy()
 * }
 */
function createBluetooth () {
  const dbus = createSystemBus()

  const bluetooth = new Bluetooth(dbus)
  const destroy = () => dbus.disconnect()

  return { bluetooth, destroy }
}

module.exports.createBluetooth = createBluetooth
