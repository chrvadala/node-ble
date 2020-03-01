const {createBluetooth} = require('..')

let bluetooth, destroy

beforeAll(() => ({bluetooth, destroy} = createBluetooth()))
afterAll(() => destroy())

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
