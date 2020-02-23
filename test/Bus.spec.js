const {Bus} = require('../src/Bus')

test('props/prop', async () => {
  const TEST_PROP = 'KernelName'
  const TEST_PROP_VALUE = 'Linux'

  const bus = new Bus(null,
    'org.freedesktop.hostname1',  //service
    '/org/freedesktop/hostname1', // object
    'org.freedesktop.hostname1'   // iface
  )


  const props = await bus.props()
  expect(props[TEST_PROP]).toEqual(TEST_PROP_VALUE)

  const prop = await bus.prop(TEST_PROP)
  expect(prop).toEqual(TEST_PROP_VALUE)

  await bus.destroy()
})

test('callMethod', async () => {
  const bus = new Bus(null,
    'org.freedesktop.hostname1', //service
    '/org',                      // object
    'org.freedesktop.DBus.Peer'  // iface
  )

  await bus.callMethod('Ping')

  const res = await bus.callMethod('GetMachineId')
  expect(typeof res).toBe('string')

  await bus.destroy()
})

test('children', async () => {
  const bus = new Bus(null,
    'org.freedesktop.hostname1',          //service
    '/org',                               // object
    'org.freedesktop.DBus.Introspectable' // iface
  )

  const children = await bus.children()
  expect(children).toEqual(['/org/freedesktop'])

  await bus.destroy()
})

test('derive', async () => {
  const bus = new Bus(null,
    'org.freedesktop.hostname1', //service
    '/org/freedesktop',          // object
    'org.freedesktop.DBus.Peer'  // iface
  )

  await bus.callMethod('Ping')

  const derivatedBus = bus.derive(
    '/org/freedesktop/hostname1',   //subobject
    'org.freedesktop.hostname1',    //iface
  )

  const obj = await derivatedBus.props()
  expect(typeof obj).toBe('object')

  await bus.destroy()
})
