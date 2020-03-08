const BusHelper = require('./BusHelper')

class GattServer {
  constructor(dbus, adapter, device) {
    this.dbus = dbus
    this.adapter = adapter
    this.device = device
    this.helper = new BusHelper(dbus, 'org.bluez', `/org/bluez/${adapter}/${device}`, 'org.bluez.Device1')

    this._services = {}
  }

  async init(){
    const servicesResolved = await this.helper.prop('ServicesResolved')
    if (!servicesResolved) {
      await this.helper.waitPropChange('ServicesResolved')
    }


    //fetch services
  }

  services(){

  }

  getPrimaryService(uuid){

  }

}

module.exports = GattServer
