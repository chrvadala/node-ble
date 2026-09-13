/* global describe, test, expect, jest */

jest.mock('../src/Bluetooth', () => class Bluetooth {
  constructor (dbus) {
    this.dbus = dbus
  }
})

const Bluetooth = require('../src/Bluetooth')
const { createBluetooth } = require('../src/index')

describe('createBluetooth', () => {
  test('creates a Bluetooth session using the system bus', async () => {
    const { bluetooth, destroy } = createBluetooth()

    expect(bluetooth).toBeInstanceOf(Bluetooth)
    expect(typeof destroy).toBe('function')

    const callDestroy = async () => {
      await destroy()
    }

    const waitClosed = () => new Promise(resolve => {
      const connection = bluetooth.dbus.connection
      connection.on('close', () => {
        resolve(true)
      })
    })

    const resWaitClosed = waitClosed()
    await callDestroy()

    await expect(resWaitClosed).resolves.toBeTruthy()
  })
})
