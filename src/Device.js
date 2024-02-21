const EventEmitter = require('events')
const BusHelper = require('./BusHelper')
const GattServer = require('./GattServer')

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
   * Service advertisement data. Keys are the UUIDs in string format followed by its byte array value.
   * @returns {object}
   */
  async getServiceAdvertisementData () {
    return this.helper.prop('ServiceData')
  }

  /**
   * Manufacturer specific advertisement data. Keys are 16 bits Manufacturer ID followed by its byte array value.
   * @returns {object}
   */
  async getManufacturerAdvertisementData () {
    return this.helper.prop('ManufacturerData')
  }

  /**
   * List of 128-bit UUIDs that represents the available remote services.
   * @returns {string[]}
   */
  async getServiceUUIDs () {
    return this.helper.prop('UUIDs')
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
          this.emit('connect', { connected: true, deviceUuid: this.device })
        } else {
          this.emit('disconnect', { connected: false, deviceUuid: this.device })
          this.helper.removeAllListeners('PropertiesChanged') // might be improved
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
   * @property {string} deviceUuid - The UUID of the device freshly connected
  */

/**
   * Disconection event
   *
   * @event Device#disconnect
   * @type {object}
   * @property {boolean} connected - Indicates current connection status.
   * @property {string} deviceUuid - The UUID of the device freshly disconnected
  */

module.exports = Device
