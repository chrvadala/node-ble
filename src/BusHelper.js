const EventEmitter = require('events')

const DEFAULT_OPTIONS = {
  usePropsEvents: false
}

class BusHelper extends EventEmitter {
  serviceName = null
  objectPath = null
  ifaceName = null
  options = {}

  _objectProxy = null
  _ifaceProxy = null
  _eventsProxy = null
  #ready = false

  constructor (dbus, serviceName, objectPath, ifaceName, options = {}) {
    super()

    this.serviceName = serviceName
    this.objectPath = objectPath
    this.ifaceName = ifaceName

    this.dbus = dbus

    this.options = {
      ...DEFAULT_OPTIONS,
      ...options
    }
  }

  /**
   * Initialize the DBus object, interface, and properties-event proxies.
   * @returns {Promise<void>}
   */
  async init () {
    if (this.#ready) return

    const objectProxy = await this.dbus.getObject(this.serviceName, this.objectPath)
    const ifaceProxy = objectProxy.as(this.ifaceName)
    const eventsProxy = objectProxy.as('org.freedesktop.DBus.Properties')

    if (this.options.usePropsEvents) {
      eventsProxy.on('PropertiesChanged', (iface, changedProps, invalidated) => {
        if (iface === this.ifaceName) {
          this.emit('PropertiesChanged', changedProps)
        }
      })
    }

    this._objectProxy = objectProxy
    this._ifaceProxy = ifaceProxy
    this._eventsProxy = eventsProxy
    this.#ready = true
  }

  /**
   * Remove local listeners and reset the initialized state.
   * @returns {Promise<void>}
   */
  async destroy () {
    this.removeAllListeners()
    this._eventsProxy.off('PropertiesChanged')
    this.#ready = false
  }

  /**
   * Read all properties exposed by the DBus interface.
   * @returns {Promise<Object>}
   */
  async props () {
    await this.init()
    return await this._ifaceProxy.$readAllProps()
  }

  /**
   * Read one property exposed by the DBus interface.
   * @param {string} propName - The property name to read.
   * @returns {Promise<*>}
   */
  async prop (propName) {
    await this.init()
    return await this._ifaceProxy.$readProp(propName)
  }

  /**
   * Write one property exposed by the DBus interface.
   * @param {string} propName - The property name to write.
   * @param {*} value - The value to assign.
   * @returns {Promise<*>}
   */
  async set (propName, value) {
    await this.init()
    return await this._ifaceProxy.$writeProp(propName, value)
  }

  /**
   * Wait for a named property to change and return its new value.
   * @param {string} propName - The property name to monitor.
   * @returns {Promise<*>}
   */
  async waitPropChange (propName) {
    await this.init()

    return new Promise((resolve) => {
      const cb = (iface, changedProps, invalidated) => {
        // console.log('changed props on %s -> %o', iface, changedProps)

        if (!(iface === this.ifaceName && (propName in changedProps))) return

        resolve(changedProps[propName])
        this._eventsProxy.off('PropertiesChanged', cb)
      }
      this._eventsProxy.on('PropertiesChanged', cb)
    })
  }

  /**
   * Return the child object paths exposed by the DBus object.
   * @returns {Promise<string[]>}
   */
  async children () {
    // I can't rely on this._objectProxy.nodes because the underlying library doesn't refresh
    const objectProxy = await this.dbus.getObject(this.serviceName, this.objectPath)

    return objectProxy.nodes
  }

  /**
   * Invoke a method on the DBus interface.
   * @param {string} methodName - The method name to invoke.
   * @param {...*} args - Arguments passed to the DBus method.
   * @returns {Promise<*>}
   */
  async callMethod (methodName, ...args) {
    await this.init()
    return this._ifaceProxy[methodName](...args)
  }
}

module.exports = BusHelper
