#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

#define DEVICE_NAME "EchoBLE"
#define SERVICE_UUID "12345678-1234-5678-1234-56789abcdef0"
#define CHARACTERISTIC_UUID1 "12345678-1234-5678-1234-56789abcdef1"
#define CHARACTERISTIC_UUID2 "12345678-1234-5678-1234-56789abcdef2"

BLEService *pService;
BLECharacteristic *pCharacteristic1;
BLECharacteristic *pCharacteristic2;
BLEServer *pServer;
bool deviceConnected = false;

/**
 * @brief Callbacks for BLE server events.
 */
class MyServerCallbacks : public BLEServerCallbacks
{
    void onConnect(BLEServer *pServer)
    {
        Serial.println("Client connected");
        deviceConnected = true;
    }

    void onDisconnect(BLEServer *pServer)
    {
        Serial.println("Client disconnected");
        // Restart advertising after disconnection
        pServer->getAdvertising()->start();
        deviceConnected = false;
    }
};

/**
 * @brief Callbacks for characteristic1 events.
 */
class MyCallbacks1 : public BLECharacteristicCallbacks
{
    std::string storedValue; // Variable to store the value of characteristic1

    void onWrite(BLECharacteristic *pCharacteristic)
    {
        std::string value = pCharacteristic->getValue();
        Serial.print("Characteristic1 value written: ");
        printValue(value);
        storedValue = value;
    }

    void onRead(BLECharacteristic *pCharacteristic)
    {
        Serial.print("Characteristic1 value read: ");
        std::string res = "ECHO>" + storedValue;
        printValue(res);
        pCharacteristic->setValue(res);
    }

    void printValue(const std::string& value)
    {
        for (int i = 0; i < value.length(); i++)
        {
            Serial.print(value[i]);
        }
        Serial.println();
    }
};

void setupBLE()
{
    BLEDevice::init(DEVICE_NAME); // Initialize BLEDevice with the device name
   
    // Print device UUID
    Serial.print("Device UUID: ");
    Serial.println(BLEDevice::getAddress().toString().c_str());

    pServer = BLEDevice::createServer(); // Create BLE server
    pServer->setCallbacks(new MyServerCallbacks()); // Set server callbacks

    pService = pServer->createService(SERVICE_UUID); // Initialize pService

    pCharacteristic1 = pService->createCharacteristic(
        CHARACTERISTIC_UUID1,
        BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_WRITE
    );
    pCharacteristic1->setCallbacks(new MyCallbacks1());

    pCharacteristic2 = pService->createCharacteristic(
        CHARACTERISTIC_UUID2,
        BLECharacteristic::PROPERTY_NOTIFY
    );
    pCharacteristic2->addDescriptor(new BLE2902());

    pService->start(); // Start the service

    BLEAdvertising *pAdvertising = pServer->getAdvertising(); // Get advertising from server
    pAdvertising->addServiceUUID(SERVICE_UUID);
    pAdvertising->start(); // Start advertising from server
    pAdvertising->setScanResponse(true);
    pAdvertising->setMinPreferred(0x06); // functions that help with iPhone connections issue
    pAdvertising->setMinPreferred(0x12);
    pServer->startAdvertising(); // Start advertising from server
}

void setup()
{
    Serial.begin(115200);
    Serial.println("Boot");
    setupBLE();
    Serial.println("Ready");
}

void loop()
{
    if (deviceConnected)
    {
        static unsigned long lastNotifyTime = 0;
        if (millis() - lastNotifyTime > 3000)
        {
            lastNotifyTime = millis();
            
            // Check if notifications are enabled
            BLE2902* p2902Descriptor = (BLE2902*)pCharacteristic2->getDescriptorByUUID(BLEUUID((uint16_t)0x2902));
            if (p2902Descriptor->getNotifications() || p2902Descriptor->getIndications())
            {
                // Notifications or indications are enabled
                Serial.println("Notifications or indications are enabled");

                std::string notificationData = "Notification data " + std::to_string(millis());
                pCharacteristic2->setValue(notificationData.c_str());
                pCharacteristic2->notify();
            }
            else
            {
                // Notifications and indications are disabled
                 Serial.println("Notifications and indications are disabled");
            }
        }
    }
}