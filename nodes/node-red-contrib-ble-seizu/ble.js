module.exports = function (RED) {
  const { createBluetooth } = require('node-ble')

  // Store active subscriptions: mac -> { device, characteristic, destroy }
  const activeSubscriptions = new Map()

  async function connectAndGetCharacteristic (mac, handle, node) {
    const { bluetooth, destroy } = createBluetooth()
    const adapter = await bluetooth.defaultAdapter()
    if (!await adapter.isDiscovering()) {
      await adapter.startDiscovery()
    }

    // Connection timeout 10 seconds
    const device = await Promise.race([
      adapter.waitDevice(mac),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('connection timeout')), 10000)
      )
    ])

    await device.connect()
    node.warn('Connected to ' + mac)
    const gattServer = await device.gatt()
    const uuid = await gattServer.getUUIDbyHandle(handle)
    if (!uuid) throw new Error('UUIDs not found for the given handle')
    const service = await gattServer.getPrimaryService(uuid.service)
    const characteristic = await service.getCharacteristic(uuid.char)
    return { device, characteristic, bluetooth, destroy }
  }

  async function connectWithRetry (mac, handle, retries, retryDelay, node) {
    for (let i = 0; i < retries; i++) {
      try {
        return await connectAndGetCharacteristic(mac, handle, node)
      } catch (err) {
        if (i === retries - 1) throw err
        await new Promise(res => setTimeout(res, retryDelay))
      }
    }
  }

  async function triggerWrite (gattServer, writeHandle, writeData) {
    const writeUuid = await gattServer.getUUIDbyHandle(writeHandle)
    if (!writeUuid) throw new Error('UUIDs not found for write handle')
    const writeService = await gattServer.getPrimaryService(writeUuid.service)
    const writeChar = await writeService.getCharacteristic(writeUuid.char)
    await writeChar.writeValue(Buffer.from(writeData, 'hex'))
  }

  async function cleanup (device, conn, node) {
    node.warn('cleanup() called')
    if (device) {
      try {
        await device.disconnect()
        node.warn('cleanup() disconnect OK')
      } catch (e) {
        node.warn('Cleanup disconnect warning: ' + e.message)
      }
    }
    if (conn) {
      try {
        conn.destroy()
        node.warn('cleanup() destroy OK')
      } catch (e) {
        node.warn('Cleanup destroy warning: ' + e.message)
      }
    }
    // Wait for BlueZ to fully release the connection
    await new Promise(res => setTimeout(res, 1000))
  }

  async function processBluetoothOperation (operation, handle, mac, data, retries, retryDelay, writeHandle, writeData, subscribeTimeout, onNotify, node) {
    let device
    let conn

    try {
      if (operation === 'write') {
        conn = await connectWithRetry(mac, handle, retries, retryDelay, node)
        device = conn.device
        await conn.characteristic.writeValue(Buffer.from(data, 'hex'))
        await cleanup(device, conn, node)
        return [{ payload: 'Write operation successful' }, null, null]

      } else if (operation === 'read') {
        conn = await connectWithRetry(mac, handle, retries, retryDelay, node)
        device = conn.device
        const value = await conn.characteristic.readValue(0)
        await cleanup(device, conn, node)
        return [{ payload: 'Read operation successful' }, null, { payload: value.toString('hex') }]

      } else if (operation === 'subscribe_once') {
        conn = await connectWithRetry(mac, handle, retries, retryDelay, node)
        device = conn.device
        return await new Promise(async (resolve, reject) => {
          const timer = setTimeout(async () => {
            node.warn('subscribe_once: timed out after ' + subscribeTimeout + 'ms')
            await cleanup(device, conn, node)
            reject(new Error('subscribe_once timed out after ' + subscribeTimeout + 'ms'))
          }, subscribeTimeout)

          try {
            conn.characteristic.on('valuechanged', async (value) => {
              clearTimeout(timer)
              await conn.characteristic.stopNotifications()
              await cleanup(device, conn, node)
              resolve([{ payload: 'Notification received' }, null, { payload: value.toString('hex') }])
            })
            await conn.characteristic.startNotifications()
            if (writeHandle && writeData) {
              const gattServer = await device.gatt()
              await triggerWrite(gattServer, parseInt(writeHandle, 16), writeData)
            }
          } catch (err) {
            clearTimeout(timer)
            await cleanup(device, conn, node)
            reject(err)
          }
        })

      } else if (operation === 'subscribe') {
        if (activeSubscriptions.has(mac)) {
          throw new Error('Already subscribed for ' + mac)
        }
        conn = await connectWithRetry(mac, handle, retries, retryDelay, node)
        device = conn.device
        conn.characteristic.on('valuechanged', (value) => {
          onNotify(value.toString('hex'))
        })
        await conn.characteristic.startNotifications()
        if (writeHandle && writeData) {
          const gattServer = await device.gatt()
          await triggerWrite(gattServer, parseInt(writeHandle, 16), writeData)
        }
        activeSubscriptions.set(mac, { device, characteristic: conn.characteristic, destroy: conn.destroy })
        return [{ payload: 'Subscribe successful' }, null, null]

      } else if (operation === 'unsubscribe') {
        const sub = activeSubscriptions.get(mac)
        if (!sub) throw new Error('No active subscription for ' + mac)
        try {
          await sub.characteristic.stopNotifications()
          await sub.device.disconnect()
          sub.destroy()
        } catch (e) {
          node.warn('Unsubscribe cleanup warning: ' + e.message)
        }
        activeSubscriptions.delete(mac)
        return [{ payload: 'Unsubscribe successful' }, null, null]

      } else {
        return [null, { payload: 'Invalid operation type' }, null]
      }

    } catch (error) {
      await cleanup(device, conn, node)
      throw new Error('Bluetooth error: ' + error.message)
    }
  }

  function BluetoothNode (config) {
    RED.nodes.createNode(this, config)
    const node = this

    node.on('input', async function (msg) {
      const operation = msg.payload.operation || config.operation
      const mac = msg.payload.mac || config.mac
      const rawHandle = msg.payload.handle || config.handle
      const data = msg.payload.data || ''
      const retries = config.retries || 3
      const retryDelay = config.retryDelay || 2000
      const subscribeTimeout = config.subscribeTimeout || 30000
      const writeHandle = msg.payload.write_handle || null
      const writeData = msg.payload.write_data || null
      node.log("Connecting...")
      node.status({ fill: 'blue', shape: 'dot', text: 'connecting...' })

      let handle = NaN
      if (typeof rawHandle === 'string') {
        handle = parseInt(rawHandle, 16)
      } else {
        handle = rawHandle
      }

      if (!mac || isNaN(handle) || !operation) {
        node.status({ fill: 'red', shape: 'ring', text: 'missing params' })
        return node.send([null, { payload: 'Missing parameter: mac, handle or operation' }, null])
      }

      if (operation === 'write' && (!data || data.length === 0)) {
        node.status({ fill: 'red', shape: 'ring', text: 'no data' })
        return node.send([null, { payload: 'Missing write data' }, null])
      }

      try {
        const onNotify = (hexValue) => {
          node.status({ fill: 'green', shape: 'dot', text: 'notification' })
          node.send([null, null, { payload: hexValue }])
        }

        const result = await processBluetoothOperation(operation, handle, mac, data, retries, retryDelay, writeHandle, writeData, subscribeTimeout, onNotify, node)
        node.status({ fill: 'green', shape: 'dot', text: 'done' })
        node.send(result)

      } catch (error) {
        node.status({ fill: 'red', shape: 'dot', text: 'error' })
        node.error(error.message)
        node.send([null, { payload: error.message }, null])
      }
    })

    // Cleanup on node redeploy/stop
    node.on('close', async () => {
      for (const [mac, sub] of activeSubscriptions) {
        try {
          await sub.characteristic.stopNotifications()
          await sub.device.disconnect()
          sub.destroy()
        } catch (e) {
          node.warn('Close cleanup warning: ' + e.message)
        }
        activeSubscriptions.delete(mac)
      }
    })
  }

  RED.nodes.registerType('ble-seizu', BluetoothNode)
}