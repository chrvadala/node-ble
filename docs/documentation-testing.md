# Running tests

This library provides two test suite types:
- Unit tests: They are available in the `/test` folder and they test every single component (class/function).
- End to end tests: They are available in the `/test-e2e` folder and they test the interaction with a real bluetooth device that you spawn on your own.


## Pre-requisite

In order to run the available test suites you have to set up right D-Bus permissions.
Execute the following script on a bash terminal

```sh
echo '<!DOCTYPE busconfig PUBLIC "-//freedesktop//DTD D-BUS Bus Configuration 1.0//EN"
  "http://www.freedesktop.org/standards/dbus/1.0/busconfig.dtd">
<busconfig>
  <policy user="__USERID__">
    <allow own="org.test"/>
    <allow send_destination="org.test"/>
    <allow send_interface="org.test.iface"/>
  </policy>
</busconfig>' | sed "s/__USERID__/$(id -un)/" | sudo tee /etc/dbus-1/system.d/node-ble-test.conf > /dev/null
```

## Run unit tests
```
npm test
```

## Run end to end (e2e) tests

The end to end test will try to connect to a real bluetooth device and read some characteristics. To do that, you need two different devices a central and a peripheral.
The test suite will act as a central, but you to need to create a fake peripheral (test device). You can follow [fake device setup guide](https://github.com/chrvadala/node-ble/blob/main/ble-test-device).

After you have prepared the device, you have to read via USB its mac address, then launch the test suite.

```shell script
TEST_DEVICE=00:00:00:00:00:00 npm run test:e2e
```
