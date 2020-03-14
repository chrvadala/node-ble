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

test("read/write", async () => {
  const characteristic = new GattCharacteristic(dbus, 'hci0', 'dev_00_00_00_00_00_00', 'characteristic0006', 'char008')

  await expect(characteristic.writeValue('not_a_buffer')).rejects.toThrow('Only buffers can be wrote')
  await expect(characteristic.writeValue(Buffer.from("hello"))).resolves.toBeUndefined()
  expect(characteristic.helper.callMethod).toHaveBeenCalledWith('WriteValue', expect.anything(), expect.anything())

  characteristic.helper.callMethod.mockResolvedValueOnce([255, 100, 0])
  await expect(characteristic.readValue()).resolves.toEqual(Buffer.from([255, 100, 0]))
})

test("notify", async ()=> {
  const characteristic = new GattCharacteristic(dbus, 'hci0', 'dev_00_00_00_00_00_00', 'characteristic0006', 'char008')

  await characteristic.startNotifications()
  expect(characteristic.helper.callMethod).toHaveBeenCalledWith('StartNotify')

  await characteristic.stopNotifications()
  expect(characteristic.helper.callMethod).toHaveBeenCalledWith('StopNotify')
})
