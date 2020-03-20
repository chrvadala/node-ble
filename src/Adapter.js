const Device = require('./Device')
const BusHelper = require('./BusHelper')
const buildTypedValue = require('./buildTypedValue')

const DEFAULT_TIMEOUT = 2 * 60 * 1000
const DEFAULT_DISCOVERY_INTERVAL = 1000

class Adapter {
  constructor (dbus, adapter) {
    this.dbus = dbus
    this.adapter = adapter
    this.helper = new BusHelper(dbus, 'org.bluez', `/org/bluez/${adapter}`, 'org.bluez.Adapter1')
  }

  async getAddress () {
    return this.helper.prop('Address')
  }

  async getAddressType () {
    return this.helper.prop('AddressType')
  }

  async getName () {
    return this.helper.prop('Name')
  }

  async getAlias () {
    return this.helper.prop('Alias')
  }

  async isPowered () {
    return this.helper.prop('Powered')
  }

  async isDiscovering () {
    return this.helper.prop('Discovering')
  }

  async startDiscovery () {
    if (await this.isDiscovering()) {
      throw new Error('Discovery already in progress')
    }

    await this.helper.callMethod('SetDiscoveryFilter', {
      Transport: buildTypedValue('string', 'le')
    })
    await this.helper.callMethod('StartDiscovery')
  }

  async stopDiscovery () {
    if (!await this.isDiscovering()) {
      throw new Error('No discovery started')
    }
    await this.helper.callMethod('StopDiscovery')
  }

  async devices () {
    const devices = await this.helper.children()
    return devices.map(Adapter.deserializeUUID)
  }

  async getDevice (uuid) {
    const serializedUUID = Adapter.serializeUUID(uuid)

    const devices = await this.helper.children()
    if (!devices.includes(serializedUUID)) {
      throw new Error('Device not found')
    }

    return new Device(this.dbus, this.adapter, serializedUUID)
  }

  async waitDevice (uuid, timeout = DEFAULT_TIMEOUT, discoveryInterval = DEFAULT_DISCOVERY_INTERVAL) {
    // this should be optimized subscribing InterfacesAdded signal

    const cancellable = []
    const discoveryHandler = new Promise((resolve, reject) => {
      const check = () => {
        this.getDevice(uuid)
          .then(device => {
            resolve(device)
          })
          .catch(e => {
            if (e.message !== 'Device not found') {
              return e
            }
          })
      }

      const handler = setInterval(check, discoveryInterval)
      cancellable.push(() => clearInterval(handler))
    })

    const timeoutHandler = new Promise((resolve, reject) => {
      const handler = setTimeout(() => {
        reject(new Error('operation timed out'))
      }, timeout)

      cancellable.push(() => clearTimeout(handler))
    })

    const device = await Promise.race([discoveryHandler, timeoutHandler])

    for (const cancel of cancellable) {
      cancel()
    }
    return device
  }

  async toString () {
    const name = await this.getName()
    const address = await this.getAddress()

    return `${name} [${address}]`
  }

  static serializeUUID (uuid) {
    return `dev_${uuid.replace(/:/g, '_')}`
  }

  static deserializeUUID (uuid) {
    return uuid.substring(4).replace(/_/g, ':')
  }
}

module.exports = Adapter
