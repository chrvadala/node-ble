jest.mock('../src/BusHelper');

const dbus = Symbol()

const Device = require('../src/Device')

test("props", async () => {
  const device = new Device(dbus, 'hci0', 'dev_00_00_00_00_00_00')
  device.helper.prop.mockImplementation((value) => Promise.resolve(({
    Name: '_name_',
    Address: '00:00:00:00:00:00',
    AddressType: 'public',
    Alias: '_alias_',
    RSSI: 100,

    Paired: true,
    Connected: true,
  }[value])))

  await expect(device.getName()).resolves.toEqual('_name_')
  await expect(device.getAddress()).resolves.toEqual('00:00:00:00:00:00')
  await expect(device.getAddressType()).resolves.toEqual('public')
  await expect(device.getAlias()).resolves.toEqual('_alias_')
  await expect(device.getRSSI()).resolves.toEqual(100)

  await expect(device.toString()).resolves.toEqual('_name_ [00:00:00:00:00:00]')
})

test("pairing", async () => {
  const device = new Device(dbus, 'hci0', 'dev_00_00_00_00_00_00')

  await expect(device.pair()).resolves.toBeUndefined()
  expect(device.helper.callMethod).toHaveBeenLastCalledWith('Pair')

  await expect(device.cancelPair()).resolves.toBeUndefined()
  expect(device.helper.callMethod).toHaveBeenLastCalledWith('CancelPair')

  expect(device.helper.callMethod).toHaveBeenCalledTimes(2)
})
