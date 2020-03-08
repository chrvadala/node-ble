const {createBluetooth} = require('..')

const TEST_DEVICE = process.env.TEST_DEVICE

let bluetooth, destroy

beforeAll(() => ({bluetooth, destroy} = createBluetooth()))
afterAll(() => destroy())

test("check properly configured", () => {
  expect(TEST_DEVICE).not.toBeUndefined()
})

test('get adapters', async () => {
  const adapters = await bluetooth.adapters()
  expect(adapters).toBeInstanceOf(Array)
})

test('adapter', async () => {
  const adapter = await bluetooth.defaultAdapter()
  if (await adapter.isDiscovering()) await adapter.stopDiscovery() //makes consistent situation

  await expect(adapter.isDiscovering()).resolves.toEqual(false)
  await adapter.startDiscovery()
  await expect(adapter.isDiscovering()).resolves.toEqual(true)

  const devices = await adapter.devices()
  expect(devices).toBeInstanceOf(Array)
  console.log({devices})

  await adapter.stopDiscovery()
})

test.only('gatt e2e', async () => {
  const adapter = await bluetooth.defaultAdapter()

  if (!await adapter.isDiscovering()) await adapter.startDiscovery()

  const device = await adapter.waitDevice(TEST_DEVICE)

  const deviceName = await device.toString()
  expect(typeof deviceName).toBe('string')
  console.log({deviceName})

  await device.connect()

  const gattServer = await device.gatt()
  const services = await gattServer.services()
  console.log({services})

  await device.disconnect()
}, 40 * 1000)
