const { defineInterface } = require('dbus-native')

const SIGNAL_INTERVAL = 10

class TestInterface {
  bus = null
  serviceName = null
  objectPath = null
  virtualProperty = ''

  constructor (bus, serviceName, objectPath, ifaceName) {
    this.bus = bus
    this.serviceName = serviceName
    this.objectPath = objectPath
    this.ifaceName = ifaceName
    this.timer = null
  }

  async init () {
    const ifaceDesc = defineInterface({
      name: this.ifaceName,
      methods: {
        Echo: {
          in: { name: 's' },
          out: { greeting: 's' },
          handler: function ({ name }) {
            // console.log(`Echo(${typeof name} ${name}) `)
            return `>>${name}`
          },
        },
      },
      properties: {
        SimpleProperty: { type: 's', access: 'read', get: () => 'foo' },
        VirtualProperty: {
          type: 's',
          get: () => this.virtualProperty,
          set: input => {
            // console.log(`VirtualProperty = (${typeof input} ${input}) `)
            this.virtualProperty = input
          }
        },
      },
      signals: {
        Ping: { args: { who: 's' } }
      }
    })

    await this.bus.requestName(this.serviceName, 0)
    await this.bus.export(this.objectPath, ifaceDesc)

    this.timer = setInterval(
      () => ifaceDesc.emit.Ping('Signal from space'),
      SIGNAL_INTERVAL
    )
  }

  async destroy () {
    clearInterval(this.timer)
    await this.bus.releaseName(this.serviceName)
  }
}

module.exports = TestInterface
