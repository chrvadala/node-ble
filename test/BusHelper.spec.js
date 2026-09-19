/* global describe, beforeAll, afterAll, test, expect */

const SERVICE_NAME = 'org.test'
const OBJECT_PATH = '/org/example'
const IFACE_NAME = 'org.test.iface'

const { systemBus } = require('dbus-native')
const BusHelper = require('../src/BusHelper')
const TestInterface = require('./helpers/TestInterface')

let dbus, iface
const destroyable = []

describe('BusHelper', () => {
  beforeAll(async () => {
    dbus = systemBus()
    if (!dbus) {
      throw new Error('Could not connect to the DBus session bus.')
    }

    iface = new TestInterface(dbus, SERVICE_NAME, OBJECT_PATH, IFACE_NAME)
    await iface.init()

    // setup children
    const paths = [
      `${OBJECT_PATH}/bar`,
      `${OBJECT_PATH}/foo`,
      `${OBJECT_PATH}/foo/abc`,
      `${OBJECT_PATH}/foo/abc/def`,
    ]

    for (const objectPath of paths) {
      const o = new TestInterface(dbus, SERVICE_NAME, objectPath, IFACE_NAME)
      await o.init()
      destroyable.push(o)
    }
  })

  afterAll(async () => {
    for (const o of destroyable) {
      await o.destroy()
    }
    await iface.destroy()
    await dbus.close()
  })

  test('props/prop', async () => {
    const helper = new BusHelper(dbus, SERVICE_NAME, OBJECT_PATH, IFACE_NAME)

    const prop = await helper.prop('SimpleProperty')
    expect(prop).toEqual('foo')

    const props = await helper.props()
    expect(props).toEqual({
      SimpleProperty: 'foo',
      VirtualProperty: expect.any(String)
    })

    await helper.set('VirtualProperty', 'abc')
    await expect(helper.prop('VirtualProperty')).resolves.toEqual('abc')
  })

  test('callMethod', async () => {
    const helper = new BusHelper(dbus, SERVICE_NAME, OBJECT_PATH, IFACE_NAME)

    const res = await helper.callMethod('Echo', 'hello')
    expect(res).toBe('>>hello')
  })

  test('children list', async () => {
    const helper = new BusHelper(dbus, SERVICE_NAME, OBJECT_PATH, IFACE_NAME)
    const children = await helper.children()
    expect(children).toEqual(['bar', 'foo'])

    const o = new TestInterface(dbus, SERVICE_NAME, `${OBJECT_PATH}/xyz`, IFACE_NAME)
    await o.init()
    destroyable.push(o)

    const children2 = await helper.children()
    expect(children2).toEqual(['bar', 'foo', 'xyz'])
  })

  test('waitPropChange', async () => {
    const helper = new BusHelper(dbus, SERVICE_NAME, OBJECT_PATH, IFACE_NAME)

    let value = await helper.prop('VirtualProperty')
    const res = helper.waitPropChange('VirtualProperty')
    await helper.set('VirtualProperty', 'hello')
    value = await helper.prop('VirtualProperty')
    expect(value).toBe('hello')

    await expect(res).resolves.toEqual('hello')

    const res2 = helper.waitPropChange('VirtualProperty')
    await helper.set('VirtualProperty', 'byebye')
    await expect(res2).resolves.toEqual('byebye')
  })

  test('propsEvents', async () => {
    const helper = new BusHelper(dbus, SERVICE_NAME, OBJECT_PATH, IFACE_NAME, { usePropsEvents: true })

    const res = new Promise((resolve) => {
      const cb = nextProps => {
        resolve(nextProps)
        helper.off('PropertiesChanged', cb)
      }

      helper.on('PropertiesChanged', cb)
    })

    await helper.set('VirtualProperty', 'bar')
    await expect(res).resolves.toMatchObject({ VirtualProperty: 'bar' })

    await helper.destroy()
  })

  test('destroy', async () => {
    const helper = new BusHelper(dbus, SERVICE_NAME, OBJECT_PATH, IFACE_NAME, { usePropsEvents: true })
    const dummyCb = () => {}

    await helper.init()
    expect(helper._eventsProxy.listenerCount('PropertiesChanged')).toBe(1)

    // Init with listener on helper (directly attached dummyCb) and _propsProxy (through method call triggered _prepare)
    helper.on('PropertiesChanged', dummyCb)
    expect(helper.listenerCount('PropertiesChanged')).toBeGreaterThan(0)
    expect(helper._eventsProxy.listenerCount('PropertiesChanged')).toBeGreaterThan(0)

    // Test remove
    helper.off('PropertiesChanged', dummyCb)
    expect(helper.listenerCount('PropertiesChanged')).toBe(0)
    expect(helper._eventsProxy.listenerCount('PropertiesChanged')).toBeGreaterThan(0) // still connected until destroy

    // Test reuse after remove (same initialization as before)
    helper.on('PropertiesChanged', dummyCb)
    await helper.callMethod('Echo', 'ping')
    expect(helper.listenerCount('PropertiesChanged')).toBeGreaterThan(0)
    expect(helper._eventsProxy.listenerCount('PropertiesChanged')).toBeGreaterThan(0)

    // Remove second time
    await helper.destroy()
    expect(helper.listenerCount('PropertiesChanged')).toBe(0)
    expect(helper._eventsProxy.listenerCount('PropertiesChanged')).toBe(0)

    // Init again
    await helper.init()
    expect(helper._eventsProxy.listenerCount('PropertiesChanged')).toBe(1)
  })
})
