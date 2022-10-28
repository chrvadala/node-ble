/* global describe, test, expect, it, jest */

jest.mock('../src/BusHelper')
jest.mock('../src/Adapter')

const Bluetooth = require('../src/Bluetooth')
const Adapter = require('../src/Adapter')

const dbus = Symbol('dbus')

test('adapters', async () => {
  const bluetooth = new Bluetooth(dbus)
  bluetooth.helper.children.mockReturnValue(['hci0', 'hci1', 'hci2'])

  const adapters = await bluetooth.adapters()
  expect(adapters).toEqual(['hci0', 'hci1', 'hci2'])
})

test('getAdapter', async () => {
  const bluetooth = new Bluetooth(dbus)
  bluetooth.helper.children.mockReturnValue(['hci0', 'hci1'])

  await expect(bluetooth.getAdapter('hci5')).rejects.toThrowError('Adapter not found')

  const adapter = await bluetooth.getAdapter('hci0')
  expect(adapter).toBeInstanceOf(Adapter)
  expect(Adapter).toHaveBeenCalledWith(dbus, 'hci0')
})

describe('defaultAdapter', () => {
  it('should not found adapters', async () => {
    const bluetooth = new Bluetooth(dbus)
    bluetooth.helper.children.mockReturnValue([])

    await expect(bluetooth.defaultAdapter()).rejects.toThrowError('No available adapters found')
  })

  it('should be able to get an adapter', async () => {
    const bluetooth = new Bluetooth(dbus)
    bluetooth.helper.children.mockReturnValue(['hci0'])

    const adapter = await bluetooth.defaultAdapter()
    expect(adapter).toBeInstanceOf(Adapter)
    expect(Adapter).toHaveBeenCalledWith(dbus, 'hci0')
  })
})

describe('getActiveAdapters', () => {
  it('should return only active adapters', async () => {
    const hci0 = new Adapter(dbus, 'hci0')
    hci0.isPowered = async () => false
    hci0.getName = async () => 'hci0'

    const hci1 = new Adapter(dbus, 'hci1')
    hci1.isPowered = async () => true
    hci1.getName = async () => 'hci1'

    const bluetooth = new Bluetooth(dbus)

    const adapters = { hci0, hci1 }
    bluetooth.getAdapter = async name => adapters[name]
    bluetooth.helper.children.mockReturnValue(['hci0', 'hci1'])

    const result = await bluetooth.activeAdapters()

    expect(result.length).toEqual(1)
    await expect(result[0].getName()).resolves.toEqual('hci1')
  })
})
