# Node BLE Testing device
This code allows you to flash an ESP32 device and create a BLE device that can be used for e2e testing.

Read [Testing](https://github.com/chrvadala/node-ble/blob/main/docs/documentation-testing.md) to see how to use it in a test.

## How to flash a test device

### 1. PlatformIO Setup
Install PlatformIO Core by following the instructions on the [official PlatformIO website](https://platformio.org/install/cli).
````bash
curl -fsSL -o get-platformio.py https://raw.githubusercontent.com/platformio/platformio-core-installer/master/get-platformio.py
python3 get-platformio.py
````

### 2. Build firmware and flash device
````bash
cd ble-test-device/
pio run -t upload
````

### 3. Watch logs (Optional)
````bash
pio device monitor
````
---

_References_
- https://en.wikipedia.org/wiki/ESP32
- https://github.com/arduino-libraries/ArduinoBLE

