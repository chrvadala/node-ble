const { systemBus: createSystemBus } = require('dbus-next')
const Bluetooth = require('./Bluetooth')

function createBluetooth () {
  const dbus = createSystemBus()

  const bluetooth = new Bluetooth(dbus)
  const destroy = () => dbus.disconnect()

  return { bluetooth, destroy }
}

module.exports.createBluetooth = createBluetooth
