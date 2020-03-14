const {createBluetooth} = require('..')

const TEST_DEVICE = process.env.TEST_DEVICE
const TEST_SERVICE = process.env.TEST_SERVICE
const TEST_CHARACTERISTIC = process.env.TEST_CHARACTERISTIC

let bluetooth, destroy

beforeAll(() => ({bluetooth, destroy} = createBluetooth()))
afterAll(() => destroy())

test("check properly configured", () => {
  expect(TEST_DEVICE).not.toBeUndefined()
  expect(TEST_SERVICE).not.toBeUndefined()
  expect(TEST_CHARACTERISTIC).not.toBeUndefined()
})

describe('gatt e2e', () => {
  test("get adapters", async () => {
    const adapters = await bluetooth.adapters()
    console.log({adapters})
  })

  let adapter;
  test("get adapter", async () => {
    adapter = await bluetooth.defaultAdapter()
  })

  test("discovery", async () => {
    if (!await adapter.isDiscovering()) {
      await adapter.startDiscovery()
    }
  })

  let device;
  test("get device", async () => {
    device = await adapter.waitDevice(TEST_DEVICE)
    const deviceName = await device.toString()
    expect(typeof deviceName).toBe('string')
    console.log({deviceName})
  }, 20 * 1000) //increases test secs

  test("connect", async () => {
    await device.connect()
  })

  let gattServer
  test("get gatt", async () => {
    gattServer = await device.gatt()
    const services = await gattServer.services()
    console.log({services})
  })

  let service
  test("get service", async () => {
    service = await gattServer.getPrimaryService(TEST_SERVICE)
    const characteristics = await service.characteristics()
    const uuid = await service.getUUID()
    console.log({service: uuid, characteristics})
  })

  let characteristic
  test("get characteristic", async () => {
    characteristic = await service.getCharacteristic(TEST_CHARACTERISTIC)
    const uuid = await characteristic.getUUID()
    console.log({characteristic: uuid})
  })

  test("read/write value", async () => {
    const string = Buffer.from(`hello_world_${new Date().toISOString()}`)

    await characteristic.writeValue(string)
    const value = await characteristic.readValue()
    expect(value).toEqual(string)
    console.log({value: value.toString()})
  })

  test("disconnect", async () => {
    await adapter.stopDiscovery()
    await device.disconnect()
  })
})
