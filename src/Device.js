const EventEmitter = require('events')
const BusHelper = require('./BusHelper')
const GattServer = require('./GattServer')

class Device extends EventEmitter {
  constructor(dbus, adapter, device) {
    super()
    this.dbus = dbus
    this.adapter = adapter
    this.device = device
    this.helper = new BusHelper(dbus, 'org.bluez', `/org/bluez/${adapter}/${device}`, 'org.bluez.Device1', {usePropsEvents: true})
  }

  async getName() {
    return await this.helper.prop('Name')
  }

  async getAddress() {
    return await this.helper.prop('Address')
  }

  async getAddressType() {
    return await this.helper.prop('AddressType')
  }

  async getAlias() {
    return await this.helper.prop('Alias')
  }

  async getRSSI() {
    return await this.helper.prop('RSSI')
  }

  async getTXPower() {
    return await this.helper.prop('TxPower')
  }

  async isPaired() {
    return await this.helper.prop('Paired')
  }

  async isConnected() {
    return await this.helper.prop('Connected')
  }

  async pair() {
    return await this.helper.callMethod('Pair')
  }

  async cancelPair() {
    return await this.helper.callMethod('CancelPair')
  }

  async connect() {
    const cb = (propertiesChanged) => {
      if ('Connected' in propertiesChanged) {
        const {value} = propertiesChanged['Connected']
        if (value) {
          this.emit('connect', {connected: true})
        } else {
          this.emit('disconnect', {connected: false})
        }
      }
    }

    this.helper.on('PropertiesChanged', cb)
    await this.helper.callMethod('Connect')
  }

  async disconnect() {
    await this.helper.callMethod('Disconnect')
    this.helper.removeAllListeners('PropertiesChanged') //might be improved
  }

  async gatt() {
    const gattServer = new GattServer(this.dbus, this.adapter, this.device)
    await gattServer.init()
    return gattServer
  }

  async toString() {
    const name = await this.getName()
    const address = await this.getAddress()

    return `${name} [${address}]`
  }
}

module.exports = Device
