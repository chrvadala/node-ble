const BusHelper = require('./BusHelper')
const GattCharacteristic = require('./GattCharacteristic')

/**
 * @classdesc GattService class interacts with a remote GATT service.
 * @class GattService
 * @see You can construct a GattService object via {@link GattServer#getPrimaryService} method.
 */
class GattService {
  constructor (dbus, adapter, device, service) {
    this.dbus = dbus
    this.adapter = adapter
    this.device = device
    this.service = service
    this.helper = new BusHelper(dbus, 'org.bluez', `/org/bluez/${adapter}/${device}/${service}`, 'org.bluez.GattService1')

    this._characteristics = {}
  }

  async init () {
    this._characteristics = {}

    const children = await this.helper.children()
    for (const c of children) {
      const characteristic = new GattCharacteristic(this.dbus, this.adapter, this.device, this.service, c)
      const uuid = await characteristic.getUUID()
      this._characteristics[uuid] = characteristic
    }
  }

  /**
   * Indicates whether or not this GATT service is a primary service.
   * @returns {boolean}
   */
  async isPrimary () {
    return this.helper.prop('Primary')
  }

  /**
   * 128-bit service UUID.
   * @returns {string}
   */
  async getUUID () {
    return this.helper.prop('UUID')
  }

  /**
   * List of available characteristic names.
   * @returns {string[]}
   */
  async characteristics () {
    return Object.keys(this._characteristics)
  }

  /**
   * Init a GattCharacteristic instance and return it
   * @param {string} uuid - Characteristic UUID.
   * @returns {GattCharacteristic}
   */
  async getCharacteristic (uuid) {
    if (uuid in this._characteristics) {
      return this._characteristics[uuid]
    }

    throw new Error('Characteristic not available')
  }

  /**
   * Human readable class identifier.
   * @returns {string}
   */
  async toString () {
    return this.getUUID()
  }
}

module.exports = GattService
