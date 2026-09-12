/* global describe, beforeAll, afterAll, test, expect */

const SERVICE_NAME = 'org.test'
const OBJECT_PATH = '/org/example'
const IFACE_NAME = 'org.test.iface'

const { systemBus } = require('dbus-native')
const TestInterface = require('./TestInterface')

describe('test TestInterface', () => {
  let bus, emu

  beforeAll(async () => {
    bus = systemBus()
    if (!bus) {
      throw new Error('Could not connect to the DBus session bus.')
    }
    emu = new TestInterface(bus, SERVICE_NAME, OBJECT_PATH, IFACE_NAME)
    await emu.init()
  })

  afterAll(async () => {
    await emu.destroy()
    await bus.close()
  })

  test('check interface props', async () => {
    // const service = bus.getService(SERVICE_NAME)
    // const object = await service.getObject(OBJECT_PATH)
    // const iface = object.as(IFACE_NAME)
    const iface = await bus.getInterface(SERVICE_NAME, OBJECT_PATH, IFACE_NAME)

    await expect(iface.$readProp('SimpleProperty')).resolves.toBe('foo')

    iface.$writeProp('VirtualProperty', 'one')
    await expect(iface.$readProp('VirtualProperty')).resolves.toBe('one')

    iface.$writeProp('VirtualProperty', 'two')
    await expect(iface.$readProp('VirtualProperty')).resolves.toBe('two')

    const props = await iface.$readAllProps()

    expect(props).toMatchSnapshot()
  })

  test('check interface methods', async () => {
    const iface = await bus.getInterface(SERVICE_NAME, OBJECT_PATH, IFACE_NAME)

    const res = await iface.Echo('Hello World')
    expect(res).toBe('>>Hello World')
  })

  test('check signals methods', async () => {
    const iface = await bus.getInterface(SERVICE_NAME, OBJECT_PATH, IFACE_NAME)

    const body1 = await new Promise(resolve => {
      iface.on('Ping', props => {
        iface.off('Ping')
        resolve(props)
      })
    })

    expect(body1).toBe('Signal from space')

    const body2 = await new Promise(resolve => {
      iface.once('Ping', resolve)
    })

    expect(body2).toBe('Signal from space')
  })
})
