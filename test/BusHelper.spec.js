/* global test, expect, beforeAll, afterAll */

const TEST_NAME = 'org.test'
const TEST_OBJECT = '/org/example'
const TEST_IFACE = 'org.test.iface'

const { systemBus: createSystemBus } = require('dbus-next')
const BusHelper = require('../src/BusHelper')
const TestInterface = require('./__interfaces/TestInterface')
const buildTypedValue = require('../src/buildTypedValue')

let dbus, iface

beforeAll(async () => {
  dbus = createSystemBus()

  await dbus.requestName(TEST_NAME)

  iface = new TestInterface(TEST_IFACE)
  dbus.export(TEST_OBJECT, iface)
})

afterAll(async () => {
  dbus.unexport(TEST_OBJECT, iface)
  await dbus.releaseName(TEST_NAME)
  await dbus.disconnect()
  /**
   * sometimes disconnect() is slow and throws the following error https://github.com/chrvadala/node-ble/issues/30
   * looks like that wait the cb here doesn't solve the issue https://github.com/dbusjs/node-dbus-next/blob/b2a6b89e79de423debb4475452db1cc410beab41/lib/bus.js#L265
   */
  await new Promise((resolve, reject) => {
    setTimeout(resolve, 50)
  })
})

test('props/prop', async () => {
  const helper = new BusHelper(dbus, TEST_NAME, TEST_OBJECT, TEST_IFACE)

  const prop = await helper.prop('SimpleProperty')
  expect(prop).toEqual('bar')

  const props = await helper.props()
  expect(props).toEqual({
    SimpleProperty: 'bar',
    VirtualProperty: 'foo'
  })

  await helper.set('SimpleProperty', buildTypedValue('string', 'abc'))
  await expect(helper.prop('SimpleProperty')).resolves.toEqual('abc')
})

test('callMethod', async () => {
  const helper = new BusHelper(dbus, TEST_NAME, TEST_OBJECT, TEST_IFACE)

  const res = await helper.callMethod('Echo', 'hello')
  expect(res).toBe('>>hello')
})

test('buildChildren', () => {
  const nodes = [
    '/foo',
    '/foo/a',
    '/foo/b/1',
    '/foo/c/1',
    '/foo/c/2'
  ]

  expect(BusHelper.buildChildren('/bar', nodes)).toEqual([])
  expect(BusHelper.buildChildren('/', nodes)).toEqual(['foo'])
  expect(BusHelper.buildChildren('/foo', nodes)).toEqual(['a', 'b', 'c'])
  expect(BusHelper.buildChildren('/foo/c', nodes)).toEqual(['1', '2'])
})

test('children', async () => {
  const helper = new BusHelper(dbus, TEST_NAME, TEST_OBJECT, TEST_IFACE)

  const a = new TestInterface(TEST_IFACE)
  dbus.export(`${TEST_OBJECT}/bar`, a)
  dbus.export(`${TEST_OBJECT}/foo`, a)
  dbus.export(`${TEST_OBJECT}/foo/abc`, a)
  dbus.export(`${TEST_OBJECT}/foo/abc/def`, a)

  const children = await helper.children()
  expect(children).toEqual(['bar', 'foo'])

  dbus.unexport(`${TEST_OBJECT}/bar`, a)
  dbus.unexport(`${TEST_OBJECT}/foo`, a)
  dbus.unexport(`${TEST_OBJECT}/foo/abc`, a)
  dbus.unexport(`${TEST_OBJECT}/foo/abc/def`, a)
})

test('disableProps', async () => {
  const helper = new BusHelper(dbus, TEST_NAME, TEST_OBJECT, TEST_IFACE, { useProps: false })

  await expect(helper.callMethod('Echo', 'hello')).resolves.toEqual('>>hello')

  await expect(helper.props()).rejects.toThrow()
  await expect(helper.prop('Test')).rejects.toThrow()
})

test('waitPropChange', async () => {
  const helper = new BusHelper(dbus, TEST_NAME, TEST_OBJECT, TEST_IFACE)

  const res = helper.waitPropChange('VirtualProperty')
  await helper.set('VirtualProperty', buildTypedValue('string', 'hello'))
  await expect(res).resolves.toEqual('hello')

  const res2 = helper.waitPropChange('VirtualProperty')
  await helper.set('VirtualProperty', buildTypedValue('string', 'byebye'))
  await expect(res2).resolves.toEqual('byebye')
})

test('propsEvents', async () => {
  const helper = new BusHelper(dbus, TEST_NAME, TEST_OBJECT, TEST_IFACE, { usePropsEvents: true })

  const res = new Promise((resolve) => {
    const cb = nextProps => {
      resolve(nextProps)
      helper.off('PropertiesChanged', cb)
    }

    helper.on('PropertiesChanged', cb)
  })

  await helper.set('VirtualProperty', buildTypedValue('string', 'bar'))
  await expect(res).resolves.toMatchObject({ VirtualProperty: { signature: 's', value: 'bar' } })
})

test('removeListeners', async () => {
  const helper = new BusHelper(dbus, TEST_NAME, TEST_OBJECT, TEST_IFACE, { useProps: true, usePropsEvents: true })

  const dummyCb = () => {}

  // Init with listener on helper (directly attached dummyCb) and _propsProxy (through method call triggered _prepare)
  helper.on('PropertiesChanged', dummyCb)
  await helper.callMethod('Echo', 'ping')
  expect(helper.listenerCount('PropertiesChanged')).toBeGreaterThan(0)
  expect(helper._propsProxy.listenerCount('PropertiesChanged')).toBeGreaterThan(0)

  // Test remove
  helper.removeListeners()
  expect(helper.listenerCount('PropertiesChanged')).toBe(0)
  expect(helper._propsProxy.listenerCount('PropertiesChanged')).toBe(0)

  // Test reuse after remove (same initialization as before)
  helper.on('PropertiesChanged', dummyCb)
  await helper.callMethod('Echo', 'ping')
  expect(helper.listenerCount('PropertiesChanged')).toBeGreaterThan(0)
  expect(helper._propsProxy.listenerCount('PropertiesChanged')).toBeGreaterThan(0)

  // Remove second time
  helper.removeListeners()
  expect(helper.listenerCount('PropertiesChanged')).toBe(0)
  expect(helper._propsProxy.listenerCount('PropertiesChanged')).toBe(0)
})
