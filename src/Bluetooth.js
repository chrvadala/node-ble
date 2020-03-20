const BusHelper = require('./BusHelper')
const Adapter = require('./Adapter')

class Bluetooth {
  constructor (dbus) {
    this.dbus = dbus
    this.helper = new BusHelper(dbus, 'org.bluez', '/org/bluez', 'org.bluez.AgentManager1', { useProps: false })
  }

  async adapters () {
    return this.helper.children()
  }

  async defaultAdapter () {
    const adapters = await this.adapters()
    if (!adapters.length) {
      throw new Error('No available adapters found')
    }

    return this.getAdapter(adapters[0])
  }

  async getAdapter (adapter) {
    const adapters = await this.adapters()
    if (!adapters.includes(adapter)) {
      throw new Error('Adapter not found')
    }

    return new Adapter(this.dbus, adapter)
  }
}

module.exports = Bluetooth
