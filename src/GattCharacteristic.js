const BusHelper = require('./BusHelper')

class GattCharacteristic {
  constructor(dbus, adapter, device, service, characteristic) {
    this.dbus = dbus
    this.adapter = adapter
    this.device = device
    this.service = service
    this.characteristics = characteristic
    this.helper = new BusHelper(dbus, 'org.bluez', `/org/bluez/${adapter}/${device}/${service}/${characteristic}`, 'org.bluez.GattCharacteristic1')
  }

  async getUUID() {
    return await this.helper.prop('UUID')
  }

  async getFlags() {
    return await this.helper.prop('Flags')
  }

  async isNotifying(){
    return await this.helper.prop('Notifying')
  }

  async readValue() {
    return await this.helper.callMethod('ReadValue')
  }

  async writeValue(value) {
    //TODO
  }

  async startNotify() {
    await this.helper.callMethod('StartNotify')
  }

  async stopNotify() {
    await this.helper.callMethod('StopNotify')
  }

  async toString() {
    return await this.getUUID()
  }
}

module.exports = GattCharacteristic
