const BusHelper = require('./BusHelper')
const GattService = require('./GattService')

/**
 * @classdesc GattServer class that provides interaction with device GATT profile.
 * @class GattServer
 * @see You can construct a Device object via {@link Device#gatt} method
 */
class GattServer {
  constructor (dbus, adapter, device) {
    this.dbus = dbus
    this.adapter = adapter
    this.device = device
    this.helper = new BusHelper(dbus, 'org.bluez', `/org/bluez/${adapter}/${device}`, 'org.bluez.Device1')

    this._services = {}
  }

  async init () {
    // TODO add lock to avoid race conditions
    this._services = {}

    const servicesResolved = await this.helper.prop('ServicesResolved')
    if (!servicesResolved) {
      await this.helper.waitPropChange('ServicesResolved')
    }

    const children = await this.helper.children()
    for (const s of children) {
      const service = new GattService(this.dbus, this.adapter, this.device, s)
      const uuid = await service.getUUID()
      await service.init()
      this._services[uuid] = service
    }
  }

  /**
   * List of available services
   * @returns {string[]}
   */
  async services () {
    return Object.keys(this._services)
  }

  /**
   * Init a GattService instance and return it
   * @param {string} uuid
   * @returns {GattService}
   */
  async getPrimaryService (uuid) {
    if (uuid in this._services) {
      return this._services[uuid]
    }

    throw new Error('Service not available')
  }
}

module.exports = GattServer
