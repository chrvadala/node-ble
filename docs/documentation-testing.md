# Running tests

This library provides two test suites:
- Unit tests: Their available in the `/test` folder and they test every single component.
- End to end tests: They're available in the `/test-e2e` folder and they test the interaction with a real bluetooth device that you spawn on your own.


## Pre-requisite

In order to run the available test suites you have to set up right DBus permissions.

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

## Run unit tests
```
npm test
```

## Run end to end (e2e) tests

The end to end test will try to connect to a real bluetooth device and read some characteristics. To do that, you need two different devices.
Prior to that, you need to create a test device. [A guide is available 
here](https://github.com/chrvadala/node-ble/blob/main/ble-test-device).

After you have prepared the device, you have to connect it via bluetooth and read its MAC Address, then launch...

```shell script
TEST_DEVICE=00:00:00:00:00:00 npm run test:e2e
```
