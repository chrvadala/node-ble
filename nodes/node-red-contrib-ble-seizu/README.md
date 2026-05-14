# node-red-contrib-ble-seizu

A Node-RED node for Bluetooth Low Energy (BLE) read, write and notify operations, based on the `node-ble` library.

## Features
- **Hybrid Configuration**: Set MAC, Handle, and Operation in the node settings or override them via `msg.payload`.
- **Auto-Retry**: Configurable retry attempts and delay for connection errors.
- **Notify Support**: Subscribe to BLE notifications, either once or continuously.
- **Integrated Write Trigger**: Optionally send a write command after notify is active (no timing issues).
- **Three Outputs**: 
  1. `stdout`: Success confirmation.
  2. `stderr`: Error messages.
  3. `return`: Raw hex data from read or notify operations.

## Operations

| Operation | Description |
|---|---|
| `read` | Read value from handle |
| `write` | Write hex data to handle |
| `subscribe_once` | Enable notify, send optional write trigger, receive first notification, auto-unsubscribe |
| `subscribe` | Enable notify, send optional write trigger, forward every notification to output 3 |
| `unsubscribe` | Disable notify and disconnect |

## Input Payload Format

### Read
```json
{
    "operation": "read",
    "handle": "0x002C",
    "mac": "90:38:0C:58:99:42"
}
```

### Write
```json
{
    "operation": "write",
    "handle": "0x002A",
    "mac": "90:38:0C:58:99:42",
    "data": "50"
}
```

### Subscribe Once (with optional write trigger)
```json
{
    "operation": "subscribe_once",
    "handle": "0x002C",
    "mac": "90:38:0C:58:99:42",
    "write_handle": "0x002A",
    "write_data": "50"
}
```

### Subscribe (with optional write trigger)
```json
{
    "operation": "subscribe",
    "handle": "0x002C",
    "mac": "90:38:0C:58:99:42",
    "write_handle": "0x002A",
    "write_data": "50"
}
```

### Unsubscribe
```json
{
    "operation": "unsubscribe",
    "handle": "0x002C",
    "mac": "90:38:0C:58:99:42"
}
```

## Node Settings

| Setting | Description | Default |
|---|---|---|
| MAC Address | BLE device MAC address | - |
| Handle | GATT handle (hex, e.g. `0x002C`) | - |
| Operation | Default operation | `read` |
| Max Retries | Connection retry attempts | `3` |
| Retry Delay | Delay between retries in ms | `2000` |

## Example: RadonEye RD200

Single Node-RED inject with `subscribe_once` — no separate write node needed:

```json
{
    "operation": "subscribe_once",
    "mac": "90:38:0C:58:99:42",
    "handle": "0x002C",
    "write_handle": "0x002A",
    "write_data": "50"
}
```

Response on output 3 (hex): `500a0a000000000000000300`

Parse radon value:
- **Byte 1** = current Radon in Bq/m³
- **Byte 2** = short term average in Bq/m³

## Installation

Local installation:
```bash
cd ~/.node-red
npm install /path/to/node-red-contrib-ble-seizu
```

Then restart Node-RED:
```bash
node-red-restart
```

## Requirements
- Node-RED
- `node-ble` library
- Linux with BlueZ (e.g. Raspberry Pi)