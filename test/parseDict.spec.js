/* global test, expect */

const { Variant } = require('dbus-next')
const parseDict = require('../src/parseDict.js')

test('parseDict', () => {
  const dict = {
    1: new Variant('ay', Buffer.from([0x01, 0x02, 0x03, 0x04])),
    2: new Variant('ay', Buffer.from([0x05, 0x06, 0x07, 0x08])),
    3: 'just a string',
    4: 42
  }

  expect(parseDict(dict)).toEqual({
    1: Buffer.from([0x01, 0x02, 0x03, 0x04]),
    2: Buffer.from([0x05, 0x06, 0x07, 0x08]),
    3: 'just a string',
    4: 42
  })
})
