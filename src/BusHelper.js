const {Variant} = require('dbus-next');

class BusHelper {
  constructor(dbus, service, object, iface, options = {}) {
    this.service = service
    this.object = object
    this.iface = iface

    this.dbus = dbus

    this.options = {
      useProps: true,
      ...options,
    }

    this._ready = false
    this._objectProxy = null
    this._ifaceProxy = null
    this._propsProxy = null
  }

  async _prepare() {
    if (this._ready) return
    const objectProxy = this._objectProxy = await this.dbus.getProxyObject(this.service, this.object);
    this._ifaceProxy = await objectProxy.getInterface(this.iface)
    if (this.options.useProps) this._propsProxy = await objectProxy.getInterface('org.freedesktop.DBus.Properties')
    this._ready = true
  }

  async props() {
    if (!this.options.useProps) throw new Error('props not available')
    await this._prepare()
    const rawProps = await this._propsProxy.GetAll(this.iface)
    const props = {}
    for (const propKey in rawProps) {
      props[propKey] = rawProps[propKey].value
    }
    return props
  }

  async prop(propName) {
    if (!this.options.useProps) throw new Error('props not available')
    await this._prepare()
    const rawProp = await this._propsProxy.Get(this.iface, propName)
    return rawProp.value
  }

  async set(propName, value) {
    if (!this.options.useProps) throw new Error('props not available')
    await this._prepare()
    await this._propsProxy.Set(this.iface, propName, value)
  }

  async waitPropChange(propName) {
    await this._prepare()
    return await new Promise((resolve) => {
      const cb = (iface, changedProps, invalidated) => {
        // console.log('changed props on %s -> %o', iface, changedProps)

        if (!(iface === this.iface && (propName in changedProps))) return

        resolve(changedProps[propName].value)
        this._propsProxy.off('PropertiesChanged', cb)
      }

      this._propsProxy.on('PropertiesChanged', cb)
    })
  }

  async children() {
    this._ready = false //WORKAROUND: it forces to construct a new ProxyObject
    await this._prepare()
    return BusHelper.buildChildren(this.object, this._objectProxy.nodes)
  }

  async callMethod(methodName, ...args) {
    await this._prepare()
    const rawRes = await this._ifaceProxy[methodName](...args.map(BusHelper.prepareMethodParam))
    return rawRes
  }

  static buildChildren(path, nodes) {
    if (path === "/") path = ""
    const children = new Set()
    for (const node of nodes) {
      if (!node.startsWith(path)) continue

      const end = node.indexOf('/', path.length + 1)
      const sub = (end >= 0) ? node.substring(path.length + 1, end) : node.substring(path.length + 1)
      if (sub.length < 1) continue

      children.add(sub)
    }
    return Array.from(children.values())
  }

  static prepareMethodParam(param) {
    if (typeof param === 'string') return param

    const outParam = {}

    for (const key in param) {
      const [signature, value] = param[key]
      outParam[key] = new Variant(signature, value)
    }

    return outParam
  }
}

module.exports = BusHelper


