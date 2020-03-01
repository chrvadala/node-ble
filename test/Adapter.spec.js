jest.mock('../src/BusHelper');
jest.mock('../src/Device');

const dbus = Symbol()

const Adapter = require('../src/Adapter')
const Device = require('../src/Device')

test("serializeUUID", () => {
  expect(Adapter.serializeUUID('00:00:00:00:00:00')).toEqual('dev_00_00_00_00_00_00')
})

test("deserializeUUID", () => {
  expect(Adapter.deserializeUUID('dev_00_00_00_00_00_00')).toEqual('00:00:00:00:00:00')
})

test("props", async () => {
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

test("discovering methods", async () => {
  const adapter = new Adapter(dbus, 'hci0')

  let isDiscovering;
  adapter.helper.prop.mockImplementation(() => Promise.resolve(isDiscovering))

  isDiscovering = false
  await expect(adapter.startDiscovery()).resolves.toBeUndefined()
  expect(adapter.helper.callMethod).toHaveBeenLastCalledWith('StartDiscovery')
  await expect(adapter.stopDiscovery()).rejects.toThrow('No discovery started')


  isDiscovering = true
  await expect(adapter.stopDiscovery()).resolves.toBeUndefined()
  expect(adapter.helper.callMethod).toHaveBeenLastCalledWith('StopDiscovery')
  await expect(adapter.startDiscovery()).rejects.toThrow('Discovery already in progress')

  expect(adapter.helper.callMethod).toHaveBeenCalledTimes(2)
})

test("devices", async () => {
  const adapter = new Adapter(dbus, 'hci0')

  adapter.helper.children.mockResolvedValueOnce([
    'dev_11_11_11_11_11_11',
    'dev_22_22_22_22_22_22',
    'dev_33_33_33_33_33_33',
  ])

  await expect(adapter.devices()).resolves.toEqual([
    '11:11:11:11:11:11',
    '22:22:22:22:22:22',
    '33:33:33:33:33:33',
  ])
})

test("getDevice", async () => {
  const adapter = new Adapter(dbus, 'hci0')

  adapter.helper.children.mockResolvedValue([
    'dev_11_11_11_11_11_11',
    'dev_22_22_22_22_22_22',
    'dev_33_33_33_33_33_33',
  ])

  await expect(adapter.getDevice('00:00:00:00:00:00')).rejects.toThrow('Device not found')
  await expect(adapter.getDevice('11:11:11:11:11:11')).resolves.toBeInstanceOf(Device)
  expect(Device).toHaveBeenCalledWith(dbus, 'hci0', 'dev_11_11_11_11_11_11')
})
