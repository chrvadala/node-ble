# node-ble

Bluetooth Low Energy (BLE) library written with only Javascript (no bindings) - baked by Bluez via DBus

[![chrvadala](https://img.shields.io/badge/website-chrvadala-orange.svg)](https://chrvadala.github.io)
[![Build Status](https://travis-ci.org/chrvadala/node-ble.svg?branch=master)](https://travis-ci.org/chrvadala/node-ble)
[![Coverage Status](https://coveralls.io/repos/github/chrvadala/node-ble/badge.svg?branch=master)](https://coveralls.io/github/chrvadala/node-ble?branch=master)
[![npm](https://img.shields.io/npm/v/node-ble.svg?maxAge=2592000?style=plastic)](https://www.npmjs.com/package/node-ble)
[![Downloads](https://img.shields.io/npm/dm/node-ble.svg)](https://www.npmjs.com/package/node-ble)
[![Donate](https://img.shields.io/badge/donate-PayPal-green.svg)](https://www.paypal.me/chrvadala/15)

# Setup
```sh
yarn add node-ble
```

# Example

## STEP 1: Get Adapter
To start a Bluetooth Low Energy (BLE) connection you need a Bluetooth adapter

```javascript
const {createBluetooth} = require('node-ble')
const {bluetooth, destroy} = createBluetooth()
const adapter = await bluetooth.defaultAdapter()
```

## STEP 2: Get a device, Connect and Get GATT Server
Use an adapter to get a remote Bluetooth device, then connect to it and bind to the GATT (Generic Attribute Profile) server.

```javascript
const device = await adapter.waitDevice('00:00:00:00:00:00')
await device.connect()
const gattServer = await device.gatt()
```

## STEP 3a: Read and write a characteristic
```javascript
const service1 = await gattServer.getPrimaryService('uuid')
const characteristic1 = await service1.getCharacteristic('uuid')
await characteristic1.writeValue(Buffer.from("Hello world"))
const buffer = await characteristic1.readValue()
console.log(buffer)
```

## STEP 3b: Subscribe to a characteristic
```javascript
const service2 = await gattServer.getPrimaryService('uuid')
const characteristic2 = await service2.getCharacteristic('uuid')
await characteristic2.startNotifications()
characteristic2.on('valuechanged', buffer => {
  console.log(buffer)
})
await characteristic2.stopNotifications()
```

### STEP 4: Disconnect
When you have done you can disconnect and destroy the session
```javascript
await device.disconnect()
destroy()
```

# Reference
```javascript
const {createBluetooth} = require('node-ble')
const {bluetooth, destroy} = createBluetooth()
```

| Method | Description |
| --- | --- |
|`Bluetooth bluetooth` |
|`void destroy()` |

## `Bluetooth`
| Method | Description |
| --- | --- |
| `String[] adapters()` | List of available adapters |
| `Promise<Adapter> defaultAdapter()` | Get an available adapter |
| `Promise<Adapter> getAdapter(String adapter)` | Get a specific adapter (one of available in `adapters()`)|

## `Adapter`
| Method | Description |
| --- | --- |
| `Promise<String> getAddress()` |
| `Promise<String> getAddressType()`|
| `Promise<String> getName()`|
| `Promise<String> getAlias()`|
| `Promise<bool> isPowered()`|
| `Promise<bool> isDiscovering()`|
| `Promise<void> startDiscovery()`|
| `Promise<void> stopDiscovery()`|
| `Promise<String[]> devices()`|
| `Promise<Device> getDevice(String uuid)`|
| `Promise<Device> waitDevice(String uuid)`|
| `Promise<String> toString()`|
| `Promise<Device> toString()`|

## `Device`
| Method | Description |
| --- | --- |
| `Promise<String> getName()` |
| `Promise<String> getAddress()` |
| `Promise<String> getAddressType()` |
| `Promise<String> getAlias()` |
| `Promise<String> getRSSI()` |
| `Promise<String> isPaired()` |
| `Promise<String> isConnected()` |
| `Promise<void> pair()` |
| `Promise<void> cancelPair()` |
| `Promise<void> connect()` |
| `Promise<void> disconnect()` |
| `Promise<GattServer> gatt()` |
| `Promise<String> toString()` |

## `GattServer`
| Method | Description |
| --- | --- |
| `Promise<String[]> services()` |
| `Promise<String[]> getPrimaryService(String uuid)` |
| `Promise<GattService> getPrimaryService(String uuid)` |

## `GattService`
| Method | Description |
| --- | --- |
| `Promise<bool> isPrimary()` |
| `Promise<String> getUUID()` |
| `Promise<String[]> characteristics()` |
| `Promise<GattCharacteristic> getCharacteristic(String uuid)` |
| `Promise<String> toString()` |

## `GattCharacteristic`
| Method | Description |
| --- | --- |
| `Promise<String> getUUID()` |
| `Promise<String[]> getFlags()` |
| `Promise<bool> isNotifying()` |
| `Promise<Buffer> readValue(Number offset = 0)` |
| `Promise<Buffer> writeValue(Buffer buffer, Number offset = 0)` |
| `Promise<void> startNotifications()` |
| `Promise<void> stopNotifications()` |
| `Promise<String> toString()` |

## Contributors
- [chrvadala](https://github.com/chrvadala) (author)

## References
- https://git.kernel.org/pub/scm/bluetooth/bluez.git/tree/doc/gatt-api.txt

## Troubleshooting
### Permission Denied
Adds the following file into `/etc/dbus-1/system.d/bluetooth.conf`

```
<policy user="<insert-user-here>">
  <allow own="org.bluez"/>
  <allow send_destination="org.bluez"/>
  <allow send_interface="org.bluez.GattCharacteristic1"/>
  <allow send_interface="org.bluez.GattDescriptor1"/>
  <allow send_interface="org.freedesktop.DBus.ObjectManager"/>
  <allow send_interface="org.freedesktop.DBus.Properties"/>

  <allow own="org.test"/>
  <allow send_destination="org.test"/>
  <allow send_interface="org.test.iface"/>
</policy>
```

Then `sudo systemctl restart bluetooth`

## Run tests
### Unit tests
```
yarn test
```

### End to end (e2e) tests
#### PC 1
```shell script
wget https://git.kernel.org/pub/scm/bluetooth/bluez.git/plain/test/example-advertisement
wget https://git.kernel.org/pub/scm/bluetooth/bluez.git/plain/test/example-gatt-server
python example-advertisement
python example-gatt-server
```

#### PC 2
```shell script
# .env
TEST_DEVICE=00:00:00:00:00:00
TEST_SERVICE=12345678-1234-5678-1234-56789abcdef0
TEST_CHARACTERISTIC=12345678-1234-5678-1234-56789abcdef1
TEST_NOTIFY_SERVICE=0000180d-0000-1000-8000-00805f9b34fb
TEST_NOTIFY_CHARACTERISTIC=00002a37-0000-1000-8000-00805f9b34fb
```
```shell script
yarn test-e2e
```
