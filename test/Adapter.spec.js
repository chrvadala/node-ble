/* global test, describe, expect, jest */

jest.mock('../src/BusHelper')
jest.mock('../src/Device')

const dbus = Symbol('dbus')

const Adapter = require('../src/Adapter')
const Device = require('../src/Device')

test('serializeUUID', () => {
  expect(Adapter.serializeUUID('00:00:00:00:00:00')).toEqual('dev_00_00_00_00_00_00')
  expect(Adapter.serializeUUID('aa:BB:cc:DD:ee:FF')).toEqual('dev_AA_BB_CC_DD_EE_FF')
})

test('deserializeUUID', () => {
  expect(Adapter.deserializeUUID('dev_00_00_00_00_00_00')).toEqual('00:00:00:00:00:00')
})

test('props', async () => {
  const adapter = new Adapter(dbus, 'hci0')
  adapter.helper.prop.mockImplementation((value) => Promise.resolve(({
    Address: '00:00:00:00:00:00',
    AddressType: 'public',
    Name: '_name_',
    Alias: '_alias_',
    Powered: true,
    Discovering: true
  }[value])))

  await expect(adapter.getAddress()).resolves.toEqual('00:00:00:00:00:00')
  await expect(adapter.getAddressType()).resolves.toEqual('public')
  await expect(adapter.getName()).resolves.toEqual('_name_')
  await expect(adapter.getAlias()).resolves.toEqual('_alias_')
  await expect(adapter.isPowered()).resolves.toEqual(true)
  await expect(adapter.isDiscovering()).resolves.toEqual(true)

  await expect(adapter.toString()).resolves.toEqual('_name_ [00:00:00:00:00:00]')
})

test('discovering methods', async () => {
  const adapter = new Adapter(dbus, 'hci0')

  let isDiscovering
  adapter.helper.prop.mockImplementation(() => Promise.resolve(isDiscovering))

  isDiscovering = false
  await expect(adapter.startDiscovery()).resolves.toBeUndefined()
  expect(adapter.helper.callMethod).toHaveBeenLastCalledWith('StartDiscovery')
  await expect(adapter.stopDiscovery()).rejects.toThrow('No discovery started')
  expect(adapter.helper.callMethod).toHaveBeenCalledTimes(2)
  adapter.helper.callMethod.mockClear()

  isDiscovering = true
  await expect(adapter.stopDiscovery()).resolves.toBeUndefined()
  expect(adapter.helper.callMethod).toHaveBeenLastCalledWith('StopDiscovery')
  await expect(adapter.startDiscovery()).rejects.toThrow('Discovery already in progress')

  expect(adapter.helper.callMethod).toHaveBeenCalledTimes(1)
})

test('devices', async () => {
  const adapter = new Adapter(dbus, 'hci0')

  adapter.helper.children.mockResolvedValueOnce([
    'dev_11_11_11_11_11_11',
    'dev_22_22_22_22_22_22',
    'dev_33_33_33_33_33_33'
  ])

  await expect(adapter.devices()).resolves.toEqual([
    '11:11:11:11:11:11',
    '22:22:22:22:22:22',
    '33:33:33:33:33:33'
  ])
})

test('getDevice', async () => {
  const adapter = new Adapter(dbus, 'hci0')

  adapter.helper.children.mockResolvedValue([
    'dev_11_11_11_11_11_11',
    'dev_22_22_22_22_22_22',
    'dev_33_33_33_33_33_33'
  ])

  await expect(adapter.getDevice('00:00:00:00:00:00')).rejects.toThrow('Device not found')
  await expect(adapter.getDevice('11:11:11:11:11:11')).resolves.toBeInstanceOf(Device)
  expect(Device).toHaveBeenCalledWith(dbus, 'hci0', 'dev_11_11_11_11_11_11')
})

describe('waitDevice', () => {
  test('immediately found', async () => {
    const adapter = new Adapter(dbus, 'hci0')

    adapter.helper.children.mockResolvedValue([
      'dev_11_11_11_11_11_11',
      'dev_22_22_22_22_22_22',
      'dev_33_33_33_33_33_33'
    ])

    await expect(adapter.waitDevice('11:11:11:11:11:11')).resolves.toBeInstanceOf(Device)
  })

  test('found after a while', async () => {
    jest.useFakeTimers()

    const adapter = new Adapter(dbus, 'hci0')

    adapter.helper.children.mockResolvedValueOnce([])
    adapter.helper.children.mockResolvedValueOnce([])
    adapter.helper.children.mockResolvedValueOnce([])
    adapter.helper.children.mockResolvedValueOnce([
      'dev_11_11_11_11_11_11',
      'dev_22_22_22_22_22_22',
      'dev_33_33_33_33_33_33'
    ])

    const res = expect(adapter.waitDevice('22:22:22:22:22:22', 90 * 1000, 500)).resolves.toBeInstanceOf(Device)

    jest.advanceTimersByTime(2000)
    expect(adapter.helper.children).toHaveBeenCalledTimes(4)

    return res
  })

  test('fail for timeout', async () => {
    jest.useFakeTimers()

    const adapter = new Adapter(dbus, 'hci0')

    adapter.helper.children.mockResolvedValue([
      'dev_11_11_11_11_11_11',
      'dev_22_22_22_22_22_22',
      'dev_33_33_33_33_33_33'
    ])

    const res = expect(adapter.waitDevice('44:44:44:44:44:44', 2 * 1000, 500)).rejects.toThrow()

    jest.advanceTimersByTime(2000)
    expect(adapter.helper.children).toHaveBeenCalledTimes(4)

    return res
  })

  test('clear intervals and timeouts after fail', async () => {
    jest.useFakeTimers()

    const adapter = new Adapter(dbus, 'hci0')

    adapter.helper.children.mockResolvedValue([
      'dev_11_11_11_11_11_11',
      'dev_22_22_22_22_22_22',
      'dev_33_33_33_33_33_33'
    ])

    const timeout = 500
    const discoveryInterval = 100

    const spyClearInterval = jest.spyOn(global, 'clearInterval')
    const spyClearTimeout = jest.spyOn(global, 'clearTimeout')

    const waitDevicePromise = adapter.waitDevice('44:44:44:44:44:44', timeout, discoveryInterval)

    jest.advanceTimersByTime(timeout)

    await expect(waitDevicePromise).rejects.toThrow('operation timed out')

    expect(spyClearInterval).toHaveBeenCalled()
    expect(spyClearTimeout).toHaveBeenCalled()
  })
})
