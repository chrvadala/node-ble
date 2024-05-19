import events = require('events');

declare namespace NodeBle {
    interface GattCharacteristic extends events.EventEmitter {
        getUUID(): Promise<string>;
        getFlags(): Promise<string[]>;
        isNotifying(): Promise<boolean>;
        readValue(offset?: number): Promise<Buffer>;
        writeValue(buffer: Buffer, optionsOrOffset?: number | WriteValueOptions): Promise<void>;
        writeValueWithoutResponse(buffer: Buffer, offset?: number): Promise<void>;
        writeValueWithResponse(buffer: Buffer, offset?: number): Promise<void>;
        startNotifications(): Promise<void>;
        stopNotifications(): Promise<void>;
        toString(): Promise<string>;

        on(event: 'valuechanged', listener: (buffer: Buffer) => void): this;
    }

    interface GattService {
        isPrimary(): Promise<Boolean>;
        getUUID(): Promise<string>;
        characteristics(): Promise<string[]>;
        toString(): Promise<string>;
        getCharacteristic(uuid: string): Promise<GattCharacteristic>;
    }

    interface GattServer {
        services(): Promise<string[]>;
        getPrimaryService(uuid: string): Promise<GattService>;
    }

    interface ConnectionState {
        connected: boolean;
    }

    interface Device extends events.EventEmitter {
        getName(): Promise<string>;
        getAddress(): Promise<string>;
        getAddressType(): Promise<string>;
        getAlias(): Promise<string>;
        getRSSI(): Promise<string>;
        getManufacturerData(): Promise<{[key:string]:any}>;
        getAdvertisingData(): Promise<{[key:string]:any}>;
        getServiceData(): Promise<{[key:string]:any}>;
        isPaired(): Promise<string>;
        isConnected(): Promise<string>;
        pair(): Promise<void>;
        cancelPair(): Promise<void>;
        connect(): Promise<void>;
        disconnect(): Promise<void>;
        gatt(): Promise<GattServer>;
        toString(): Promise<string>;

        on(event: 'connect', listener: (state: ConnectionState) => void): this;
        on(event: 'disconnect', listener: (state: ConnectionState) => void): this;
    }

    interface Adapter {
        getAddress(): Promise<string>;
        getAddressType(): Promise<string>;
        getName(): Promise<string>;
        getAlias(): Promise<string>;
        isPowered(): Promise<boolean>;
        isDiscovering(): Promise<boolean>;
        startDiscovery(): Promise<void>;
        stopDiscovery(): Promise<void>;
        devices(): Promise<string[]>;
        getDevice(uuid: string): Promise<Device>;
        waitDevice(uuid: string, timeout?: number, discoveryInterval?: number): Promise<Device>;
        toString(): Promise<string>;
    }

    interface Bluetooth {
        adapters(): Promise<string[]>;
        defaultAdapter(): Promise<Adapter>;
        getAdapter(adapter: string): Promise<Adapter>;
    }

    function createBluetooth(): {
        destroy(): void;
        bluetooth: Bluetooth;
    };

    interface WriteValueOptions {
        offset?: number;
        type?: 'reliable' | 'request' | 'command';
    }
}

export = NodeBle;

