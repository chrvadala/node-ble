/* global test, expect, beforeAll, afterAll, jest */
const { getTestDevice } = require('./e2e-test-utils.js')
const { createBluetooth } = require('..')

const TEST_DEVICE = getTestDevice()

let bluetooth, destroy, adapter, device

beforeAll(async () => {
  ({ bluetooth, destroy } = createBluetooth())
  adapter = await bluetooth.defaultAdapter()
  if (!await adapter.isDiscovering()) await adapter.startDiscovery()
}, 20 * 1000)

afterAll(async () => {
  await adapter.stopDiscovery()
  destroy()
})

test.each(['#1', '#2', '#3'])('gatt e2e %s', async (attempt) => {
  const onConnect = jest.fn(() => console.log({ attempt, event: 'connect' }))
  const onDisconnect = jest.fn(() => console.log({ attempt, event: 'disconnect' }))

  expect(TEST_DEVICE).not.toBeUndefined()
  device = await adapter.waitDevice(TEST_DEVICE)
  device.on('connect', onConnect)
  device.on('disconnect', onDisconnect)
  await device.connect()

  const dbus = bluetooth.dbus

  const name = `/org/bluez/${device.adapter}/${device.device}`
  const event = `{"path":"${name}","interface":"org.freedesktop.DBus.Properties","member":"PropertiesChanged"}`
  // console.log(dbus.signals._events)
  expect(dbus.signals.listenerCount(event)).toBe(1)
  await device.disconnect()
  expect(dbus.signals.listenerCount(event)).toBe(0)

  expect(onConnect).toHaveBeenCalledTimes(1)
  expect(onDisconnect).toHaveBeenCalledTimes(1)
}, 10 * 1000)
