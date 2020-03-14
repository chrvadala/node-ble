const BusHelper = require('./BusHelper')
const buildTypedValue = require('./buildTypedValue')

class GattCharacteristic {
  constructor(dbus, adapter, device, service, characteristic) {
    this.dbus = dbus
    this.adapter = adapter
    this.device = device
    this.service = service
    this.characteristic = characteristic
    this.helper = new BusHelper(dbus, 'org.bluez', `/org/bluez/${adapter}/${device}/${service}/${characteristic}`, 'org.bluez.GattCharacteristic1')
  }

  async getUUID() {
    return await this.helper.prop('UUID')
  }

  async getFlags() {
    return await this.helper.prop('Flags')
  }

  async isNotifying() {
    return await this.helper.prop('Notifying')
  }

  async readValue(offset = 0) {
    const options = {
      offset: buildTypedValue('uint16', offset)
    }
    const payload = await this.helper.callMethod('ReadValue', options)
    return Buffer.from(payload)
  }

  async writeValue(value, offset = 0) {
    if (!Buffer.isBuffer(value)) {
      throw new Error('Only buffers can be wrote')
    }
    const options = {
      offset: buildTypedValue('uint16', offset),
      type: buildTypedValue('string', 'reliable'),
    }
    const {data} = value.toJSON()
    await this.helper.callMethod('WriteValue', data, options)
  }

  async startNotifications() {
    await this.helper.callMethod('StartNotify')
  }

  async stopNotifications() {
    await this.helper.callMethod('StopNotify')
  }

  async toString() {
    return await this.getUUID()
  }
}

module.exports = GattCharacteristic
