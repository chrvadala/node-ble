/* global test, expect */

const buildTypedValue = require('../src/buildTypedValue.js')
const { Variant } = require('dbus-next')

test('buildTypedValue', () => {
  expect(buildTypedValue('string', 'bar')).toEqual(new Variant('s', 'bar'))
  expect(buildTypedValue('int16', 100)).toEqual(new Variant('n', 100))
  expect(buildTypedValue('boolean', true)).toEqual(new Variant('b', true))

  expect(() => buildTypedValue('notvalid', true)).toThrow('Unrecognized type')
})
