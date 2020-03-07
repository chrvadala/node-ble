const {systemBus: createSystemBus, Variant} = require('dbus-next');
const BusHelper = require('../src/BusHelper')

let dbus;

beforeAll(() => dbus = createSystemBus())
afterAll(async () => await dbus.disconnect())

test('props/prop', async () => {
  const TEST_PROP = 'KernelName'
  const TEST_PROP_VALUE = 'Linux'

  const bus = new BusHelper(
    dbus,
    'org.freedesktop.hostname1',  //service
    '/org/freedesktop/hostname1', // object
    'org.freedesktop.hostname1'   // iface
  )


  const props = await bus.props()
  expect(props[TEST_PROP]).toEqual(TEST_PROP_VALUE)

  const prop = await bus.prop(TEST_PROP)
  expect(prop).toEqual(TEST_PROP_VALUE)
})

test('callMethod', async () => {
  const bus = new BusHelper(
    dbus,
    'org.freedesktop.hostname1', //service
    '/org',                      // object
    'org.freedesktop.DBus.Peer'  // iface
  )

  await bus.callMethod('Ping')

  const res = await bus.callMethod('GetMachineId')
  expect(typeof res).toBe('string')
})

test('buildChildren', () => {
  const nodes = [
    '/foo',
    '/foo/a',
    '/foo/b/1',
    '/foo/c/1',
    '/foo/c/2',
  ]

  expect(BusHelper.buildChildren('/bar', nodes)).toEqual([])
  expect(BusHelper.buildChildren('/', nodes)).toEqual(['foo'])
  expect(BusHelper.buildChildren('/foo', nodes)).toEqual(['a', 'b', 'c'])
  expect(BusHelper.buildChildren('/foo/c', nodes)).toEqual(['1', '2'])
})

test('children', async () => {
  const bus = new BusHelper(
    dbus,
    'org.freedesktop.hostname1',          //service
    '/org',                               // object
    'org.freedesktop.DBus.Introspectable' // iface
  )

  const children = await bus.children()
  expect(children).toEqual(['freedesktop'])
})

test('disableProps', async () => {
  const bus = new BusHelper(
    dbus,
    'org.bluez',              // service
    '/org/bluez',             // object
    'org.bluez.AgentManager1', // iface
    {useProps: false}
  )

  expect(Array.isArray(await bus.children())).toBe(true)

  await expect(bus.props()).rejects.toThrow()
  await expect(bus.prop('Test')).rejects.toThrow()
})

test("prepareMethodParam", () => {
  const param = {
    a: ['s', 'bar'],
    b: ['n', 100],
    c: ['b', false]
  }

  const expected = {
    a: new Variant('s', 'bar'),
    b: new Variant('n', 100),
    c: new Variant('b', false),
  }

  expect(BusHelper.prepareMethodParam(param)).toEqual(expected)
})
