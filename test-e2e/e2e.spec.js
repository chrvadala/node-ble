/* global test, describe, expect, beforeAll, afterAll */

const { createBluetooth } = require('..')

const {
  TEST_DEVICE, // ADDRESS OF A BLE TEST DEVICE

  TEST_SERVICE, // FOR READ/WRITE TESTING
  TEST_CHARACTERISTIC, // FOR READ/WRITE TESTING

  TEST_NOTIFY_SERVICE, // FOR NOTIFY TESTING
  TEST_NOTIFY_CHARACTERISTIC // FOR NOTIFY TESTING
} = process.env

let bluetooth, destroy

beforeAll(() => ({ bluetooth, destroy } = createBluetooth()))
afterAll(() => destroy())

test('check properly configured', () => {
  expect(TEST_DEVICE).not.toBeUndefined()
  expect(TEST_SERVICE).not.toBeUndefined()
  expect(TEST_CHARACTERISTIC).not.toBeUndefined()
  expect(TEST_NOTIFY_SERVICE).not.toBeUndefined()
  expect(TEST_NOTIFY_CHARACTERISTIC).not.toBeUndefined()
})

describe('gatt e2e', () => {
  test('get adapters', async () => {
    const adapters = await bluetooth.adapters()
    console.log({ adapters })
  })

  let adapter
  test('get adapter', async () => {
    adapter = await bluetooth.defaultAdapter()
  })

  test('discovery', async () => {
    if (!await adapter.isDiscovering()) {
      await adapter.startDiscovery()
    }
  })

  let device
  test('get device', async () => {
    device = await adapter.waitDevice(TEST_DEVICE)
    const deviceName = await device.toString()
    expect(typeof deviceName).toBe('string')
    console.log({ deviceName })
  }, 20 * 1000) // increases test secs

  test('connect', async () => {
    device.on('connect', () => console.log('connect'))
    device.on('disconnect', () => console.log('disconnect'))

    await device.connect()
  }, 20 * 1000)

  let gattServer
  test('get gatt', async () => {
    gattServer = await device.gatt()
    const services = await gattServer.services()
    console.log({ services })
  }, 20 * 1000) // increases test secs

  let service
  test('get service', async () => {
    service = await gattServer.getPrimaryService(TEST_SERVICE)
    const uuid = await service.getUUID()
    expect(uuid).toEqual(TEST_SERVICE)
    console.log({
      serviceUUID: uuid,
      service: service.service,
      characteristics: await service.characteristics()
    })
  })

  let characteristic
  test('get characteristic', async () => {
    characteristic = await service.getCharacteristic(TEST_CHARACTERISTIC)
    const uuid = await characteristic.getUUID()
    expect(uuid).toEqual(TEST_CHARACTERISTIC)
    console.log({
      characteristic: characteristic.characteristic,
      characteristicUUID: uuid
    })
  })

  test('read/write value', async () => {
    const string = Buffer.from(`hello_world_${new Date().toISOString()}`)

    await characteristic.writeValue(string)
    const value = await characteristic.readValue()
    expect(value).toEqual(string)
    console.log({ value: value.toString() })
  })

  test('notify', async () => {
    const notifiableService = await gattServer.getPrimaryService(TEST_NOTIFY_SERVICE)
    const notifiableCharacteristic = await notifiableService.getCharacteristic(TEST_NOTIFY_CHARACTERISTIC)

    console.log({
      notifiable: {
        service: notifiableService.service,
        serviceUUID: await notifiableService.getUUID(),

        characteristic: notifiableCharacteristic.characteristic,
        characteristicUUID: await notifiableCharacteristic.getUUID()
      }
    })
    await notifiableCharacteristic.startNotifications()

    const res = new Promise(resolve => {
      notifiableCharacteristic.on('valuechanged', buffer => {
        console.log({ notifiedBuffer: buffer })
        resolve(buffer)
      })
    })

    await expect(res).resolves.toBeInstanceOf(Buffer)

    await notifiableCharacteristic.stopNotifications()
  })

  test('disconnect', async () => {
    await adapter.stopDiscovery()
    await device.disconnect()
    await new Promise((resolve, reject) => setTimeout(resolve, 100))
  })
})
