/* global test, expect, jest */

jest.mock('../src/BusHelper')
jest.mock('../src/GattService', () => {
  const UUIDs = {
    service001: '00000000-0000-1000-8000-000000000001',
    service002: '00000000-0000-1000-8000-000000000002',
    service003: '00000000-0000-1000-8000-000000000003'
  }

  class GattServiceMock {
    constructor (dbus, adapter, device, service) {
      this._service = service
      this.init = jest.fn()
    }

    async getUUID () {
      return Promise.resolve(UUIDs[this._service])
    }
  }

  return GattServiceMock
})

const GattServer = require('../src/GattServer')
const GattService = require('../src/GattService')

const dbus = Symbol('dbus')

test('init', async () => {
  const gattServer = new GattServer(dbus, 'hci0', 'dev_00_00_00_00_00_00')

  gattServer.helper.children.mockResolvedValue([
    'service001',
    'service002',
    'service003'
  ])

  gattServer.helper.prop.mockImplementation(propName => propName === 'ServicesResolved' ? true : undefined)

  await gattServer.init()

  await expect(gattServer.services()).resolves.toEqual([
    '00000000-0000-1000-8000-000000000001',
    '00000000-0000-1000-8000-000000000002',
    '00000000-0000-1000-8000-000000000003'
  ])

  const service = await gattServer.getPrimaryService('00000000-0000-1000-8000-000000000002')
  await expect(service).toBeInstanceOf(GattService)
  await expect(service.getUUID()).resolves.toBe('00000000-0000-1000-8000-000000000002')
  await expect(service._service).toBe('service002')
})
