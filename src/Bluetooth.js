const BusHelper = require('./BusHelper')
const Adapter = require('./Adapter')

/**
 * @classdesc Top level object that represent a bluetooth session
 * @class Bluetooth
 * @see You can construct a Bluetooth session via {@link createBluetooth} function
 */
class Bluetooth {
  constructor (dbus) {
    this.dbus = dbus
    this.helper = new BusHelper(dbus, 'org.bluez', '/org/bluez', 'org.bluez.AgentManager1', { useProps: false })
  }

  /**
   *  List of available adapter names
   * @async
   * @returns {string[]}
   */
  async adapters () {
    return this.helper.children()
  }

  /**
   * Get first available adapter
   * @async
   * @throws Will throw an error if there aren't available adapters.
   * @returns {Adapter}
   */
  async defaultAdapter () {
    const adapters = await this.adapters()
    if (!adapters.length) {
      throw new Error('No available adapters found')
    }

    return this.getAdapter(adapters[0])
  }

  /**
   * Init an adapter instance and returns it
   * @async
   * @param {string} adapter - Name of an adapter
   * @throw Will throw adapter not found if provided name isn't valid.
   * @returns {Adapter}
   */
  async getAdapter (adapter) {
    const adapters = await this.adapters()
    if (!adapters.includes(adapter)) {
      throw new Error('Adapter not found')
    }

    return new Adapter(this.dbus, adapter)
  }

  /**
   * List all available (powered) adapters
   * @async
   * @returns {Promise<Adapter[]>}
   */
  async activeAdapters () {
    const adapterNames = await this.adapters()
    const allAdapters = await Promise.allSettled(adapterNames.map(async name => {
      const adapter = await this.getAdapter(name)
      const isPowered = await adapter.isPowered()
      return { adapter, isPowered }
    }))

    return allAdapters
      .filter(item => item.status === 'fulfilled' && item.value.isPowered)
      .map(item => item.value.adapter)
  }
}

module.exports = Bluetooth
