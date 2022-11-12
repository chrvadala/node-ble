# node-ble

Bluetooth Low Energy (BLE) library written with pure Node.js (no bindings) - baked by Bluez via DBus

[![chrvadala](https://img.shields.io/badge/website-chrvadala-orange.svg)](https://chrvadala.github.io)
[![Test](https://github.com/chrvadala/node-ble/workflows/Test/badge.svg)](https://github.com/chrvadala/node-ble/actions)
[![Coverage Status](https://coveralls.io/repos/github/chrvadala/node-ble/badge.svg?branch=master)](https://coveralls.io/github/chrvadala/node-ble?branch=master)
[![npm](https://img.shields.io/npm/v/node-ble.svg?maxAge=2592000?style=plastic)](https://www.npmjs.com/package/node-ble)
[![Downloads](https://img.shields.io/npm/dm/node-ble.svg)](https://www.npmjs.com/package/node-ble)
[![Donate](https://img.shields.io/badge/donate-GithubSponsor-green.svg)](https://github.com/sponsors/chrvadala)


# Documentation
- [Documentation testing](https://github.com/chrvadala/node-ble/blob/main/docs/documentation-testing.md)
- [APIs](https://github.com/chrvadala/node-ble/blob/main/docs/api.md)
  - [createBluetooth](https://github.com/chrvadala/node-ble/blob/main/docs/api.md#createBluetooth)
  - [Bluetooth](https://github.com/chrvadala/node-ble/blob/main/docs/api.md#Bluetooth)
  - [Adapter](https://github.com/chrvadala/node-ble/blob/main/docs/api.md#Adapter)
  - [Device](https://github.com/chrvadala/node-ble/blob/main/docs/api.md#Device)
  - [GattServer](https://github.com/chrvadala/node-ble/blob/main/docs/api.md#GattServer)
  - [GattService](https://github.com/chrvadala/node-ble/blob/main/docs/api.md#GattService)
  - [GattCharacteristic](https://github.com/chrvadala/node-ble/blob/main/docs/api.md#GattCharacteristic)

# Install
```sh
npm install node-ble
```

# Examples

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

## STEP 5: Disconnect
When you have done you can disconnect and destroy the session.
```javascript
await device.disconnect()
destroy()
```

# Compatibility
This library works on many architectures supported by Linux.
It leverages on Bluez driver, a component supported by the following platforms and distributions https://www.bluez.org/about

*Node-ble* has been tested on the following environment:
- Raspbian
- Ubuntu
# Changelog
- **0.x** - Beta version
- **1.0** - First official version
- **1.1** - Migrates to gh-workflows
- **1.2** - Upgrades deps
- **1.3** - Adds typescript definitions [#10](https://github.com/chrvadala/node-ble/pull/10)
- **1.4** - Upgrades deps
- **1.5** - Adds write options configuration  `async writeValue (value, optionsOrOffset = {})` [#20](https://github.com/chrvadala/node-ble/pull/20); Upgrades deps
- **1.6** - Upgrades deps and removes some dependencies; migrates to npm; improves gh-actions
- **1.7** - Fixes compatibility issue [#30](https://github.com/chrvadala/node-ble/issues/30); Adds JSdoc; Deprecates NodeJS 10 and 12; Upgrades deps;
- **1.8** - Upgrades deps and gh-actions os; Adds `Bluetooth.activeAdapters()` func [#45](https://github.com/chrvadala/node-ble/pull/45); 
- **1.9** - Upgrades deps; Adds `writeValueWithoutResponse()` and `writeValueWithResponse` methods [#47](https://github.com/chrvadala/node-ble/pull/47); Improves typescript definition [#48](https://github.com/chrvadala/node-ble/pull/48) 

# Contributors
- [chrvadala](https://github.com/chrvadala) (author)
- [pascalopitz](https://github.com/pascalopitz)
- [lupol](https://github.com/lupol)
- [altaircunhajr](https://github.com/altaircunhajr)
- [derwehr](https://github.com/derwehr)
- [mxc42](https://github.com/mxc42)

# References
- https://git.kernel.org/pub/scm/bluetooth/bluez.git/tree/doc/adapter-api.txt
- https://git.kernel.org/pub/scm/bluetooth/bluez.git/tree/doc/device-api.txt
- https://git.kernel.org/pub/scm/bluetooth/bluez.git/tree/doc/gatt-api.txt
- https://webbluetoothcg.github.io/web-bluetooth - method signatures follow, when possible, WebBluetooth standards
- https://developers.google.com/web/updates/2015/07/interact-with-ble-devices-on-the-web - method signatures follow, when possible, WebBluetooth standards

# Similar libraries
- https://github.com/noble/noble
- https://github.com/abandonware/noble (noble fork)
- https://www.npmjs.com/package/node-web-bluetooth

# Useful commands
| Command | Description |
| --- | --- |
| rm -r /var/lib/bluetooth/* | Clean Bluetooth cache |
| hciconfig -a | Adapter info |
| hcitool dev | Adapter info (through Bluez) |
| d-feet | DBus debugging tool |
| nvram bluetoothHostControllerSwitchBehavior=never | Only on Parallels |
