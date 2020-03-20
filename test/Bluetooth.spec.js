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
