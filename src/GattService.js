const BusHelper = require('./BusHelper')
const GattCharacteristic = require('./GattCharacteristic')

class GattService {
  constructor(dbus, adapter, device, service) {
    this.dbus = dbus
    this.adapter = adapter
    this.device = device
    this.service = service
    this.helper = new BusHelper(dbus, 'org.bluez', `/org/bluez/${adapter}/${device}/${service}`, 'org.bluez.GattService1')

    this._characteristics = {}
  }

  async init() {
    this._characteristics = {}

    let children = await this.helper.children()
    for (const c of children) {
      let characteristic = new GattCharacteristic(this.dbus, this.adapter, this.device, this.service, c)
      let uuid = await characteristic.getUUID()
      this._characteristics[uuid] = characteristic
    }
  }

  async primary() {
    return await this.helper.prop('Primary')
  }

  async getUUID() {
    return await this.helper.prop('UUID')
  }

  async characteristics() {
    return Object.keys(this._characteristics)
  }

  async getCharacteristic(uuid) {
    if (uuid in this._characteristics) {
      return this._characteristics[uuid]
    }

    throw new Error('Characteristic not available')
  }

  async toString() {
    return await this.getUUID()
  }
}

module.exports = GattService
