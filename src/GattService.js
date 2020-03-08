const BusHelper = require('./BusHelper')

class GattService {
  constructor(dbus, adapter, device, service){
    this.dbus = dbus
    this.adapter = adapter
    this.device = device
    this.service = service
    this.helper = new BusHelper(dbus, 'org.bluez', `/org/bluez/${adapter}/${device}/${service}`, 'org.bluez.GattService1')
  }

  async primary() {
    return await this.helper.prop('Primary')
  }

  async getUUID() {
    return await this.helper.prop('UUID')
  }

  async characteristics() {
    //TODO
  }

  async toString(){
    return await this.UUID
  }
}

module.exports = GattService
