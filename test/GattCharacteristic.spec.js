jest.mock('../src/BusHelper')
const GattCharacteristic = require('../src/GattCharacteristic')
const dbus = Symbol()

test("props", async () => {
  const characteristic = new GattCharacteristic(dbus, 'hci0', 'dev_00_00_00_00_00_00', 'characteristic0006', 'char008')
  characteristic.helper.prop.mockImplementation((value) => Promise.resolve(({
    UUID: 'foobar',
    Flags: ['indicate'],
    Notifying: true,
  }[value])))

  await expect(characteristic.getUUID()).resolves.toEqual('foobar')
  await expect(characteristic.isNotifying()).resolves.toEqual(true)
  await expect(characteristic.getFlags()).resolves.toEqual(['indicate'])
  await expect(characteristic.toString()).resolves.toEqual('foobar')
})

test.todo("method")
