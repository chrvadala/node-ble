/* global test, expect, beforeAll, afterAll */
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
  expect(TEST_DEVICE).not.toBeUndefined()
  device = await adapter.waitDevice(TEST_DEVICE)
  device.on('connect', () => console.log({ attempt, event: 'connect' }))
  device.on('disconnect', () => console.log({ attempt, event: 'disconnect' }))
  await device.connect()

  const dbus = bluetooth.dbus
  const name = `/org/bluez/${device.adapter}/${device.device}`
  // console.log(dbus._signals._events)
  const listenerCount = dbus._signals.listenerCount(`{"path":"${name}","interface":"org.freedesktop.DBus.Properties","member":"PropertiesChanged"}`)
  expect(listenerCount).toBe(1)
  await device.disconnect()
}, 10 * 1000)
