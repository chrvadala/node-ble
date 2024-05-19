const EventEmitter = require('events')
const BusHelper = require('./BusHelper')
const GattServer = require('./GattServer')
const parseDict = require('./parseDict')

/**
 * @classdesc Device class interacts with a remote device.
 * @class Device
 * @extends EventEmitter
 * @see You can construct a Device object via {@link Adapter#getDevice} method
 */
class Device extends EventEmitter {
  constructor (dbus, adapter, device) {
    super()
    this.dbus = dbus
    this.adapter = adapter
    this.device = device
    this.helper = new BusHelper(dbus, 'org.bluez', `/org/bluez/${adapter}/${device}`, 'org.bluez.Device1', { usePropsEvents: true })
  }

  /**
   * The Bluetooth remote name.
   * @returns {string}
   */
  async getName () {
    return this.helper.prop('Name')
  }

  /**
   * The Bluetooth device address of the remote device.
   * @returns {string}
   */
  async getAddress () {
    return this.helper.prop('Address')
  }

  /**
   * The Bluetooth device Address Type (public, random).
   * @returns {string}
   */
  async getAddressType () {
    return this.helper.prop('AddressType')
  }

  /**
   * The name alias for the remote device.
   * @returns {string}
   */
  async getAlias () {
    return this.helper.prop('Alias')
  }

  /**
   * Received Signal Strength Indicator of the remote device
   * @returns {number}
   */
  async getRSSI () {
    return this.helper.prop('RSSI')
  }

  /**
   * Advertised transmitted power level.
   * @returns {number}
   */
  async getTXPower () {
    return this.helper.prop('TxPower')
  }

  /**
   * Advertised transmitted manufacturer data.
   * @returns {Object.<string, any>}
   */
  async getManufacturerData () {
    return parseDict(await this.helper.prop('ManufacturerData'))
  }

  /**
   * Advertised transmitted data. (experimental: this feature might not be fully supported by bluez)
   * @returns {Object.<string, any>}
   */
  async getAdvertisingData () {
    return parseDict(await this.helper.prop('AdvertisingData'))
  }

  /**
   * Advertised transmitted data.
   * @returns {Object.<string, any>}
   */
  async getServiceData () {
    return parseDict(await this.helper.prop('ServiceData'))
  }

  /**
   * Indicates if the remote device is paired.
   * @returns {boolean}
   */
  async isPaired () {
    return this.helper.prop('Paired')
  }

  /**
   * Indicates if the remote device is currently connected.
   * @returns {boolean}
   */
  async isConnected () {
    return this.helper.prop('Connected')
  }

  /**
   * This method will connect to the remote device
   */
  async pair () {
    return this.helper.callMethod('Pair')
  }

  /**
   * This method can be used to cancel a pairing operation initiated by the Pair method.
   */
  async cancelPair () {
    return this.helper.callMethod('CancelPair')
  }

  /**
   * Connect to remote device
   */
  async connect () {
    const cb = (propertiesChanged) => {
      if ('Connected' in propertiesChanged) {
        const { value } = propertiesChanged.Connected
        if (value) {
          this.emit('connect', { connected: true })
        } else {
          this.emit('disconnect', { connected: false })
        }
      }
    }

    this.helper.on('PropertiesChanged', cb)
    await this.helper.callMethod('Connect')
  }

  /**
   * Disconnect remote device
   */
  async disconnect () {
    await this.helper.callMethod('Disconnect')
    this.helper.removeListeners()
  }

  /**
   * Init a GattServer instance and return it
   * @returns {GattServer}
   */
  async gatt () {
    const gattServer = new GattServer(this.dbus, this.adapter, this.device)
    await gattServer.init()
    return gattServer
  }

  /**
   * Human readable class identifier.
   * @returns {string}
   */
  async toString () {
    const name = await this.getName()
    const address = await this.getAddress()

    return `${name} [${address}]`
  }
}

/**
   * Connection event
   *
   * @event Device#connect
   * @type {object}
   * @property {boolean} connected - Indicates current connection status.
  */

/**
   * Disconection event
   *
   * @event Device#disconnect
   * @type {object}
   * @property {boolean} connected - Indicates current connection status.
  */

module.exports = Device
