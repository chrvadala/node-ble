/* global test, describe, expect, beforeAll, afterAll */
const { getTestDevice } = require('./e2e-test-utils.js')
const { createBluetooth } = require('..')

const TEST_SERVICE = '12345678-1234-5678-1234-56789abcdef0' // FOR READ/WRITE TESTING
const TEST_CHARACTERISTIC = '12345678-1234-5678-1234-56789abcdef1' // FOR READ/WRITE TESTING

const TEST_NOTIFY_SERVICE = '12345678-1234-5678-1234-56789abcdef0' // FOR NOTIFY TESTING
const TEST_NOTIFY_CHARACTERISTIC = '12345678-1234-5678-1234-56789abcdef2' // FOR NOTIFY TESTING

const TEST_DEVICE = getTestDevice()

let bluetooth, destroy

beforeAll(() => ({ bluetooth, destroy } = createBluetooth()))
afterAll(() => destroy())

test('check properly configured', () => {
  expect(TEST_DEVICE).not.toBeUndefined()
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
    const isConnected = await device.isConnected()
    console.log({ isConnected })
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
    const now = new Date().toISOString()
    const string = Buffer.from(`hello_world_${now}`)
    const expected = Buffer.from(`ECHO>hello_world_${now}`)

    await characteristic.writeValue(string)
    const value = await characteristic.readValue()
    expect(value).toEqual(expected)
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

    const res = await new Promise(resolve => {
      notifiableCharacteristic.on('valuechanged', buffer => {
        console.log({ notifiedBuffer: buffer, string: buffer.toString() })
        resolve(buffer)
      })
    })

    console.log({ notifiedString: res.toString() })
    expect(res).toBeInstanceOf(Buffer)
    expect(res.toString().startsWith('Notification data')).toBeTruthy()

    await notifiableCharacteristic.stopNotifications()
  })

  test('disconnect', async () => {
    await adapter.stopDiscovery()
    await device.disconnect()
    await new Promise((resolve, reject) => setTimeout(resolve, 100))
  })
})
