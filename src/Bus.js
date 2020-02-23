const {systemBus: createSystemBus} = require('dbus-next');

class Bus {
  constructor(service, object, iface, options = {}) {
    this.service = service
    this.object = object
    this.iface = iface

    this.dbus = options.dbus || createSystemBus();
    this.options = {
      useProps: true,
      dbus: null,
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

  async children() {
    await this._prepare()
    return buildChildren(this.object, this._objectProxy.nodes)
  }

  async callMethod(methodName, ...args) {
    await this._prepare()
    const rawRes = await this._ifaceProxy[methodName](...args)
    return rawRes
  }

  async destroy() {
    this.dbus.disconnect()
  }

  derive(object, iface) {
    return new Bus(this.service, object, iface, {dbus: this.dbus})
  }
}

function buildChildren(path, nodes) {
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


module.exports.Bus = Bus
module.exports.buildChildren = buildChildren


