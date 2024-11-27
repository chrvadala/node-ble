/* global test, expect, jest */

jest.doMock('../src/BusHelper', () => {
  const EventEmitter = jest.requireActual('events')

  return class BusHelperMock extends EventEmitter {
    constructor () {
      super()
      this._prepare = jest.fn()
      this.props = jest.fn()
      this.prop = jest.fn()
      this.set = jest.fn()
      this.waitPropChange = jest.fn()
      this.children = jest.fn()
      this.callMethod = jest.fn()
    }
  }
})
const buildTypedValue = require('../src/buildTypedValue')
const GattCharacteristic = require('../src/GattCharacteristic')
const dbus = Symbol('dbus')

test('props', async () => {
  const characteristic = new GattCharacteristic(dbus, 'hci0', 'dev_00_00_00_00_00_00', 'characteristic0006', 'char008')
  characteristic.helper.prop.mockImplementation((value) => Promise.resolve(({
    UUID: 'foobar',
    Flags: ['indicate'],
    Notifying: true
  }[value])))

  await expect(characteristic.getUUID()).resolves.toEqual('foobar')
  await expect(characteristic.isNotifying()).resolves.toEqual(true)
  await expect(characteristic.getFlags()).resolves.toEqual(['indicate'])
  await expect(characteristic.toString()).resolves.toEqual('foobar')
})

test('read/write', async () => {
  const characteristic = new GattCharacteristic(dbus, 'hci0', 'dev_00_00_00_00_00_00', 'characteristic0006', 'char008')
  const writeValueOptions = (offset = 0, type = 'reliable') => {
    return { offset: buildTypedValue('uint16', offset), type: buildTypedValue('string', type) }
  }

  await expect(characteristic.writeValue('not_a_buffer')).rejects.toThrow('Only buffers can be wrote')
  await expect(characteristic.writeValueWithResponse('not_a_buffer')).rejects.toThrow('Only buffers can be wrote')
  await expect(characteristic.writeValueWithoutResponse('not_a_buffer')).rejects.toThrow('Only buffers can be wrote')

  await expect(characteristic.writeValue(Buffer.from('hello'), 5)).resolves.toBeUndefined()
  expect(characteristic.helper.callMethod).toHaveBeenCalledWith('WriteValue', expect.anything(), writeValueOptions(5))

  await expect(characteristic.writeValue(Buffer.from('hello'))).resolves.toBeUndefined()
  expect(characteristic.helper.callMethod).toHaveBeenCalledWith('WriteValue', expect.anything(), writeValueOptions())

  await expect(characteristic.writeValue(Buffer.from('hello'), { type: 'command' })).resolves.toBeUndefined()
  expect(characteristic.helper.callMethod).toHaveBeenCalledWith('WriteValue', expect.anything(), writeValueOptions(0, 'command'))

  await expect(characteristic.writeValue(Buffer.from('hello'), { offset: 9, type: 'request' })).resolves.toBeUndefined()
  expect(characteristic.helper.callMethod).toHaveBeenCalledWith('WriteValue', expect.anything(), writeValueOptions(9, 'request'))

  await expect(characteristic.writeValue(Buffer.from('hello'), 'incorrect argument')).resolves.toBeUndefined()
  expect(characteristic.helper.callMethod).toHaveBeenCalledWith('WriteValue', expect.anything(), writeValueOptions())

  await expect(characteristic.writeValueWithResponse(Buffer.from('hello'))).resolves.toBeUndefined()
  expect(characteristic.helper.callMethod).toHaveBeenCalledWith('WriteValue', expect.anything(), writeValueOptions(0, 'request'))

  await expect(characteristic.writeValueWithoutResponse(Buffer.from('hello'))).resolves.toBeUndefined()
  expect(characteristic.helper.callMethod).toHaveBeenCalledWith('WriteValue', expect.anything(), writeValueOptions(0, 'command'))

  characteristic.helper.callMethod.mockResolvedValueOnce([255, 100, 0])
  await expect(characteristic.readValue()).resolves.toEqual(Buffer.from([255, 100, 0]))
})

test('notify', async () => {
  const characteristic = new GattCharacteristic(dbus, 'hci0', 'dev_00_00_00_00_00_00', 'characteristic0006', 'char008')

  await characteristic.startNotifications()
  expect(characteristic.helper.callMethod).toHaveBeenCalledWith('StartNotify')

  await characteristic.stopNotifications()
  expect(characteristic.helper.callMethod).toHaveBeenCalledWith('StopNotify')
})

test('event:valuechanged', async () => {
  const characteristic = new GattCharacteristic(dbus, 'hci0', 'dev_00_00_00_00_00_00', 'characteristic0006', 'char008')

  await characteristic.startNotifications()

  const res = new Promise((resolve) => {
    const cb = (value) => {
      characteristic.off('valuechanged', cb)
      resolve(value)
    }
    characteristic.on('valuechanged', cb)
  })

  characteristic.helper.emit('PropertiesChanged',
    { Value: { signature: 'ay', value: [0x62, 0x61, 0x72] } } // means bar
  )

  await expect(res).resolves.toEqual(Buffer.from('bar'))

  await characteristic.stopNotifications()
})

test('race condition between event:valuechanged / startNotification', async () => {
  const characteristic = new GattCharacteristic(dbus, 'hci0', 'dev_00_00_00_00_00_00', 'characteristic0006', 'char008')
  const cb = jest.fn(value => {})
  characteristic.on('valuechanged', cb)

  // Wrap the call to StartNotify with an early property change to check this event is not lost in a race condition
  characteristic.helper.callMethod.mockImplementationOnce(async (method) => {
    if (method !== 'StartNotify') {
      throw new Error('Unexpected state in unit test')
    }

    await characteristic.helper.callMethod('StartNotify')

    // Send the first event right after StartNotify
    characteristic.helper.emit('PropertiesChanged',
      { Value: { signature: 'ay', value: [0x62, 0x61, 0x72] } } // means bar
    )
  })

  // Start notifications, wait 200ms and send a second event
  characteristic.startNotifications()
  await new Promise((resolve) => setTimeout(resolve, 200))
  characteristic.helper.emit('PropertiesChanged',
    { Value: { signature: 'ay', value: [0x62, 0x61, 0x72] } } // means bar
  )

  // Check the mocked callback function has been called twice
  expect(cb.mock.calls).toHaveLength(2)

  // Cleanup
  characteristic.off('valuechanged', cb)
})
