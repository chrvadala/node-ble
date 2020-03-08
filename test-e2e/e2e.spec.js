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

test('device connection', async () => {
  const adapter = await bluetooth.defaultAdapter()

  if (!await adapter.isDiscovering()) await adapter.startDiscovery()

  const device = await adapter.waitDevice(TEST_DEVICE)

  const string = await device.toString()

  expect(typeof string).toBe('string')

  console.log({device: string})
}, 20 * 1000)
