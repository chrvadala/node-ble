# node-ble

Bluetooth Low Energy (BLE) library written with pure Node.js (no bindings) - baked by Bluez via DBus

[![chrvadala](https://img.shields.io/badge/website-chrvadala-orange.svg)](https://chrvadala.github.io)
[![Test](https://github.com/chrvadala/node-ble/workflows/Test/badge.svg)](https://github.com/chrvadala/node-ble/actions)
[![Coverage Status](https://coveralls.io/repos/github/chrvadala/node-ble/badge.svg?branch=master)](https://coveralls.io/github/chrvadala/node-ble?branch=master)
[![npm](https://img.shields.io/npm/v/node-ble.svg?maxAge=2592000?style=plastic)](https://www.npmjs.com/package/node-ble)
[![Downloads](https://img.shields.io/npm/dm/node-ble.svg)](https://www.npmjs.com/package/node-ble)
[![Donate](https://img.shields.io/badge/donate-PayPal-green.svg)](https://www.paypal.me/chrvadala/25)

# Setup
```sh
yarn add node-ble
```

# Example

## Provide permissions
In order to allow a connection with the DBus daemon, you have to set up right permissions.

Create the file `/etc/dbus-1/system.d/node-ble.conf` with the following content (customize with userid)

```xml
<!DOCTYPE busconfig PUBLIC "-//freedesktop//DTD D-BUS Bus Configuration 1.0//EN"
  "http://www.freedesktop.org/standards/dbus/1.0/busconfig.dtd">
<busconfig>
  <policy user="%userid%">
   <allow own="org.bluez"/>
    <allow send_destination="org.bluez"/>
    <allow send_interface="org.bluez.GattCharacteristic1"/>
    <allow send_interface="org.bluez.GattDescriptor1"/>
    <allow send_interface="org.freedesktop.DBus.ObjectManager"/>
    <allow send_interface="org.freedesktop.DBus.Properties"/>
  </policy>
</busconfig>
```

## STEP 1: Get Adapter
To start a Bluetooth Low Energy (BLE) connection you need a Bluetooth adapter.

```javascript
const {createBluetooth} = require('node-ble')
const {bluetooth, destroy} = createBluetooth()
const adapter = await bluetooth.defaultAdapter()
```

## STEP 2: Start discovering
In order to find a Bluetooth Low Energy device out, you have to start a discovery operation.
```javascript
if (! await adapter.isDiscovering())
  await adapter.startDiscovery()
```

## STEP 3: Get a device, Connect and Get GATT Server
Use an adapter to get a remote Bluetooth device, then connect to it and bind to the GATT (Generic Attribute Profile) server.

```javascript
const device = await adapter.waitDevice('00:00:00:00:00:00')
await device.connect()
const gattServer = await device.gatt()
```

## STEP 4a: Read and write a characteristic.
```javascript
const service1 = await gattServer.getPrimaryService('uuid')
const characteristic1 = await service1.getCharacteristic('uuid')
await characteristic1.writeValue(Buffer.from("Hello world"))
const buffer = await characteristic1.readValue()
console.log(buffer)
```

## STEP 4b: Subscribe to a characteristic.
```javascript
const service2 = await gattServer.getPrimaryService('uuid')
const characteristic2 = await service2.getCharacteristic('uuid')
await characteristic2.startNotifications()
characteristic2.on('valuechanged', buffer => {
  console.log(buffer)
})
await characteristic2.stopNotifications()
```

### STEP 5: Disconnect
When you have done you can disconnect and destroy the session.
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
| `Promise<String[]> adapters()` | List of available adapters |
| `Promise<Adapter> defaultAdapter()` | Get an available adapter |
| `Promise<Adapter> getAdapter(String adapter)` | Get a specific adapter (one of available in `adapters()`)|

## `Adapter`
| Method | Description |
| --- | --- |
| `Promise<String> getAddress()` | The Bluetooth device address. |
| `Promise<String> getAddressType()`| The Bluetooth  Address Type. One of `public` or `random`. |
| `Promise<String> getName()`| The Bluetooth system name (pretty hostname). |
| `Promise<String> getAlias()`| The Bluetooth friendly name. |
| `Promise<bool> isPowered()`| Adapter power status. |
| `Promise<bool> isDiscovering()`| Indicates that a device discovery procedure is active. |
| `Promise<void> startDiscovery()`| Starts the device discovery session. |
| `Promise<void> stopDiscovery()`| Cancel any previous StartDiscovery transaction. |
| `Promise<String[]> devices()`| List of discovered Bluetooth Low Energy devices |
| `Promise<Device> getDevice(String uuid)`| Returns an available Bluetooth Low Energy (`waitDevice` is preferred)|
| `Promise<Device> waitDevice(String uuid)`| Returns a Bluetooth Low Energy device as soon as it is available |
| `Promise<String> toString()`| User friendly adapter name |

## `Device` extends `EventEmitter`
| Method | Description |
| --- | --- |
| `Promise<String> getName()` | The Bluetooth remote name. |
| `Promise<String> getAddress()` | The Bluetooth device address of the remote device. |
| `Promise<String> getAddressType()` | The Bluetooth  Address Type. One of `public` or `random`. |
| `Promise<String> getAlias()` | The name alias for the remote device. |
| `Promise<String> getRSSI()` | Received Signal Strength Indicator of the remote device. |
| `Promise<String> isPaired()` | Indicates if the remote device is paired. |
| `Promise<String> isConnected()` | Indicates if the remote device is currently connected. |
| `Promise<void> pair()` | Connects to the remote device, initiate pairing and then retrieve GATT primary services (needs a default agent to handle wizard).|
| `Promise<void> cancelPair()` | This method can be used to cancel a pairing operation initiated by the Pair method. |
| `Promise<void> connect()` | This is a generic method to connect any profiles the remote device supports that can be connected to and have been flagged as auto-connectable on our side. |
| `Promise<void> disconnect()` | This method gracefully disconnects all connected profiles and then terminates low-level ACL connection. |
| `Promise<GattServer> gatt()` | Waits services resolving, then returns a connection to the remote Gatt Server
| `Promise<String> toString()` | User friendly device name. |

| Event | Description |
| --- | --- |
| `connect` | Connected to device |
| `disconnect` | Disconnected from device |

## `GattServer`
| Method | Description |
| --- | --- |
| `Promise<String[]> services()` | List of available services |
| `Promise<GattService> getPrimaryService(String uuid)` | Returns a specific Primary Service |

## `GattService`
| Method | Description |
| --- | --- |
| `Promise<bool> isPrimary()` | Indicates whether or not this GATT service is a	primary service. |
| `Promise<String> getUUID()` | 128-bit service UUID. |
| `Promise<String[]> characteristics()` | List of available characteristic UUIDs. |
| `Promise<GattCharacteristic> getCharacteristic(String uuid)` | Returns a specific characteristic. |
| `Promise<String> toString()` | User friendly service name. |

## `GattCharacteristic` extends `EventEmitter`
| Method | Description |
| --- | --- |
| `Promise<String> getUUID()` | 128-bit characteristic UUID. |
| `Promise<String[]> getFlags()` | Defines how the characteristic value can be used. |
| `Promise<bool> isNotifying()` | True, if notifications or indications on this characteristic are currently enabled. |
| `Promise<Buffer> readValue(Number offset = 0)` | Issues a request to read the value of the characteristic and returns the value if the operation was successful. |
| `Promise<void> writeValue(Buffer buffer, Number offset = 0)` | Issues a request to write the value of the characteristic. |
| `Promise<void> startNotifications()` | Starts a notification session from this characteristic if it supports value notifications or indications. |
| `Promise<void> stopNotifications()` | This method will cancel any previous StartNotify transaction. |
| `Promise<String> toString()` | User friendly characteristic name. |

| Event | Description |
| --- | --- |
| valuechanged | New value is notified. (invoke `startNotifications()` to enable notifications)

## Compatibility
This library works on many architectures supported by Linux.
It leverages on Bluez driver, a component supported by the following platforms and distributions https://www.bluez.org/about

*Node-ble* has been tested on the following environment:
- Raspbian GNU/Linux 10 (buster)
- Ubuntu 18.04.4 LTS
- Ubuntu 20.04 LTS

## Changelog
- **0.x** - Beta version
- **1.0** - First official version
- **1.1** - Migrates to gh-workflows
- **1.2** - Upgrades deps
- **1.3** - Adds typescript definitions [#10](https://github.com/chrvadala/node-ble/pull/10)
- **1.4** - Upgrades deps

## Contributors
- [chrvadala](https://github.com/chrvadala) (author)
- [pascalopitz](https://github.com/pascalopitz)

## Run tests
In order to run test suite you have to set up right DBus permissions.

Create the file `/etc/dbus-1/system.d/node-ble-test.conf` with the following content (customize with userid)

```xml
<!DOCTYPE busconfig PUBLIC "-//freedesktop//DTD D-BUS Bus Configuration 1.0//EN"
  "http://www.freedesktop.org/standards/dbus/1.0/busconfig.dtd">
<busconfig>
  <policy user="%userid%">
    <allow own="org.test"/>
    <allow send_destination="org.test"/>
    <allow send_interface="org.test.iface"/>
  </policy>
</busconfig>
```

### Unit tests
```
yarn test
```

### End to end (e2e) tests

The end to end test will try to connect to a real bluetooth device and read some characteristics. To do that, you need two different devices.

#### Device 1
```shell script
wget https://git.kernel.org/pub/scm/bluetooth/bluez.git/plain/test/example-advertisement
wget https://git.kernel.org/pub/scm/bluetooth/bluez.git/plain/test/example-gatt-server
python example-advertisement
python example-gatt-server
hcitool dev #this command shows bluetooth mac address
```

#### Device 2
```shell script
# .env
TEST_DEVICE=00:00:00:00:00:00
TEST_SERVICE=12345678-1234-5678-1234-56789abcdef0
TEST_CHARACTERISTIC=12345678-1234-5678-1234-56789abcdef1
TEST_NOTIFY_SERVICE=0000180d-0000-1000-8000-00805f9b34fb
TEST_NOTIFY_CHARACTERISTIC=00002a37-0000-1000-8000-00805f9b34fb
```

```shell script
yarn test:e2e
```

## References
- https://git.kernel.org/pub/scm/bluetooth/bluez.git/tree/doc/adapter-api.txt
- https://git.kernel.org/pub/scm/bluetooth/bluez.git/tree/doc/device-api.txt
- https://git.kernel.org/pub/scm/bluetooth/bluez.git/tree/doc/gatt-api.txt
- https://webbluetoothcg.github.io/web-bluetooth - method signatures follow, when possible, WebBluetooth standards
- https://developers.google.com/web/updates/2015/07/interact-with-ble-devices-on-the-web - method signatures follow, when possible, WebBluetooth standards

## Similar libraries
- https://github.com/noble/noble
- https://github.com/abandonware/noble (noble fork)
- https://www.npmjs.com/package/node-web-bluetooth

## Useful commands
| Command | Description |
| --- | --- |
| rm -r /var/lib/bluetooth/* | Clean Bluetooth cache |
| hciconfig -a | Adapter info |
| hcitool dev | Adapter info (through Bluez) |
| d-feet | DBus debugging tool |
| nvram bluetoothHostControllerSwitchBehavior=never | Only on Parallels |
