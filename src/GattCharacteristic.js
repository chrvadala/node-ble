const EventEmitter = require('events')
const BusHelper = require('./BusHelper')
const buildTypedValue = require('./buildTypedValue')

class GattCharacteristic extends EventEmitter {
  constructor (dbus, adapter, device, service, characteristic) {
    super()
    this.dbus = dbus
    this.adapter = adapter
    this.device = device
    this.service = service
    this.characteristic = characteristic
    this.helper = new BusHelper(dbus, 'org.bluez', `/org/bluez/${adapter}/${device}/${service}/${characteristic}`, 'org.bluez.GattCharacteristic1', { usePropsEvents: true })
  }

  async getUUID () {
    return this.helper.prop('UUID')
  }

  async getFlags () {
    return this.helper.prop('Flags')
  }

  async isNotifying () {
    return this.helper.prop('Notifying')
  }

  async readValue (offset = 0) {
    const options = {
      offset: buildTypedValue('uint16', offset)
    }
    const payload = await this.helper.callMethod('ReadValue', options)
    return Buffer.from(payload)
  }

  async writeValue (value, optionsOrOffset = {}) {
    if (!Buffer.isBuffer(value)) {
      throw new Error('Only buffers can be wrote')
    }

    const options = typeof optionsOrOffset === 'number' ? { offset: optionsOrOffset } : optionsOrOffset
    const mergedOptions = Object.assign({ offset: 0, type: 'reliable' }, options)

    const callOptions = {
      offset: buildTypedValue('uint16', mergedOptions.offset),
      type: buildTypedValue('string', mergedOptions.type)
    }

    const { data } = value.toJSON()
    await this.helper.callMethod('WriteValue', data, callOptions)
  }

  async startNotifications () {
    await this.helper.callMethod('StartNotify')

    const cb = (propertiesChanged) => {
      if ('Value' in propertiesChanged) {
        const { value } = propertiesChanged.Value
        this.emit('valuechanged', Buffer.from(value))
      }
    }

    this.helper.on('PropertiesChanged', cb)
  }

  async stopNotifications () {
    await this.helper.callMethod('StopNotify')
    this.helper.removeAllListeners('PropertiesChanged') // might be improved
  }

  async toString () {
    return this.getUUID()
  }
}

module.exports = GattCharacteristic
