/* global test, expect, jest */

jest.mock('../src/BusHelper')
jest.mock('../src/GattCharacteristic', () => {
  const UUIDs = {
    char0007: '00000000-0000-1000-8000-000000000007',
    char000b: '00000000-0000-1000-8000-000000000008',
    char0010: '00000000-0000-1000-8000-000000000009'
  }

  class GattCharacteristicMock {
    constructor (dbus, adapter, device, service, characteristic) {
      this._characteristic = characteristic
      this.init = jest.fn()
    }

    async getUUID () {
      return Promise.resolve(UUIDs[this._characteristic])
    }
  }

  return GattCharacteristicMock
})

const GattService = require('../src/GattService')
const GattCharacteristic = require('../src/GattCharacteristic')
const dbus = Symbol('dbus')

test('init', async () => {
  const service = new GattService(dbus, 'hci0', 'dev_00_00_00_00_00_00', 'service0006')
  service.helper.children.mockResolvedValue([
    'char0007',
    'char000b',
    'char0010'
  ])

  await service.init()

  await expect(service.characteristics()).resolves.toEqual([
    '00000000-0000-1000-8000-000000000007',
    '00000000-0000-1000-8000-000000000008',
    '00000000-0000-1000-8000-000000000009'
  ])

  const characteristic = await service.getCharacteristic('00000000-0000-1000-8000-000000000008')
  expect(characteristic).toBeInstanceOf(GattCharacteristic)
  await expect(characteristic.getUUID()).resolves.toEqual('00000000-0000-1000-8000-000000000008')
  await expect(characteristic._characteristic).toEqual('char000b')
})

test('props', async () => {
  const service = new GattService(dbus, 'hci0', 'dev_00_00_00_00_00_00', 'service0006')
  service.helper.prop.mockImplementation((value) => Promise.resolve(({
    Primary: true,
    UUID: 'abcdef'
  }[value])))

  await expect(service.getUUID()).resolves.toEqual('abcdef')
  await expect(service.isPrimary()).resolves.toEqual(true)
  await expect(service.toString()).resolves.toEqual('abcdef')
})
