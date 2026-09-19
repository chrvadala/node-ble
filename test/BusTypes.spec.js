/* global describe, test, expect */

const { Variant } = require('dbus-native')
const BusTypes = require('../src/BusTypes')

describe('BusTypes', () => {
  test('uint16 creates a dbus variant with the expected signature', () => {
    const value = BusTypes.uint16(42)

    expect(value).toBeInstanceOf(Variant)
    expect(value.signature).toBe('q')
    expect(value.value).toBe(42)
  })
})
