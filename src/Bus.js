const {systemBus: createSystemBus} = require('dbus-next');

class Bus {
    constructor(dbus, service, object, iface) {
        this.dbus = dbus || createSystemBus();
        this.service = service
        this.object = object
        this.iface = iface

        this._ready = false
        this._objectProxy = null
        this._ifaceProxy = null
        this._propsProxy = null
    }

    async _prepare() {
        if (this._ready) return
        const objectProxy = this._objectProxy = await this.dbus.getProxyObject(this.service, this.object);
        this._ifaceProxy = await objectProxy.getInterface(this.iface)
        this._propsProxy = await objectProxy.getInterface('org.freedesktop.DBus.Properties')
        this._ready = true
    }

    async props() {
        await this._prepare()
        const rawProps = await this._propsProxy.GetAll(this.iface)
        const props = {}
        for (const propKey in rawProps) {
            props[propKey] = rawProps[propKey].value
        }
        return props
    }

    async prop(propName) {
        await this._prepare()
        const rawProp = await this._propsProxy.Get(this.iface, propName)
        return rawProp.value
    }

    async children() {
        await this._prepare()
        return this._objectProxy.nodes
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
        return new Bus(this.dbus, this.service, object, iface)
    }
}

module.exports.Bus = Bus
