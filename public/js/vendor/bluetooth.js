const d=document,
        n=navigator
import {createToast} from "./notification.js";
import { sleep } from "./sleep.js";
export class Bluetooth {
    constructor(type) {
        this.type = type; //tiene que identificarse con el dispositivo bluetooth desconectado
        if (!n.bluetooth) {
            throw new Error('Web Bluetooth API is not available. Make sure you are using a compatible browser and the feature is enabled.');
        }
        this.bluetooth=null;
        this.gattServer = null;
        this.service=null;
        this.rxCharacteristic =null;
        this.txCharacteristic = null;
        this.responsePromise = null;
        this.responseResolver = null;
        this.message=null;
        this.messageBuffer = "";
        this.operationQueue = [];
        this.isProcessingQueue = false;
        this.isVerified = false;
        this.operationLock = false;
        this.connected=false;
    }
    async connect(){
        console.log(`Conectando a bluetooth device ${this.type}`);
        try {
            if(!this.bluetooth){
                this.bluetooth=await n.bluetooth.requestDevice({
                    filters: [{ services: ['0000ffe0-0000-1000-8000-00805f9b34fb'] }]
                });
            }
            createToast("info","Bluetooth: ","Connecting...");
            console.log(`Device ${this.type} Connecting to GATT server...`);
            this.gattServer=await this.bluetooth.gatt.connect();
            console.log(`Device ${this.type} Getting Service...`);
            this.service = await this.gattServer.getPrimaryService('0000ffe0-0000-1000-8000-00805f9b34fb');
            console.log(`Device ${this.type} Getting TX Characteristic...`);
            this.txCharacteristic=await this.service.getCharacteristic('0000ffe1-0000-1000-8000-00805f9b34fb');
            console.log(`Device ${this.type} Getting RX Characteristic...`);
            this.rxCharacteristic = await this.service.getCharacteristic('0000ffe1-0000-1000-8000-00805f9b34fb');
            console.log(`Device ${this.type} Starting Listeners`);
            this.rxCharacteristic.startNotifications();
            this.rxCharacteristic.addEventListener('characteristicvaluechanged', this.handleOnMessage);
            // Verificación inicial del dispositivo
            if (!this.isVerified) {
                await this.verifyDevice();
            }

            this.connected=true;
            console.log(`Device ${this.type} connected and verified!`);
            return true;
        } catch (err) {
            console.error(`Error connecting to device ${this.type}:`, err);
            this.connected=false;
            this.disconnect();
            return false;
        }
    }
    async setCredentials(info){
        try {
            await this.connect();
            await this.sendBluetoothMessage(info);
            const dataString = await this.waitForResponse();
            const data = JSON.parse(dataString);
            if (data.issue !== "Set credentials" || data.state !== "OK") {
                throw new Error("A problem occurred while configuring the SSEM device");
                
            }
            return true;
        } catch (error) {
            console.error("Ocurrio un error al setear las credenciales",error);
        }
        

    }
    async disconnect(){
        if (this.bluetooth && this.bluetooth.gatt.connected) {
            this.connected=false;
            this.bluetooth.gatt.disconnect();
            console.log('Disconnected!');
            return true;
        }
        return false;
    }
    async partialDisconnect() {
        try {
            if (this.gattServer && this.bluetooth) {
                console.log(`Reconnecting to service and characteristics for ${this.type}`);
                this.service = await this.gattServer.getPrimaryService('0000ffe0-0000-1000-8000-00805f9b34fb');
                this.txCharacteristic = await this.service.getCharacteristic('0000ffe1-0000-1000-8000-00805f9b34fb');
                this.rxCharacteristic = await this.service.getCharacteristic('0000ffe1-0000-1000-8000-00805f9b34fb');
                console.log(`Device ${this.type} Starting Listeners`);
                this.rxCharacteristic.startNotifications();
                this.rxCharacteristic.addEventListener('characteristicvaluechanged', this.handleOnMessage);
            }
        } catch (err) {
            console.error(`Error reconnecting to service and characteristics for device ${this.type}:`, err);
        } 
    }
    async partialReconnect() {
        if (this.gattServer && this.bluetooth) {
            console.log(`Reconnecting to service and characteristics for ${this.type}`);
            try {
                this.service = await this.gattServer.getPrimaryService('0000ffe0-0000-1000-8000-00805f9b34fb');
                console.log(`Device ${this.type} Getting TX Characteristic...`);
                this.txCharacteristic = await this.service.getCharacteristic('0000ffe1-0000-1000-8000-00805f9b34fb');
                console.log(`Device ${this.type} Getting RX Characteristic...`);
                this.rxCharacteristic = await this.service.getCharacteristic('0000ffe1-0000-1000-8000-00805f9b34fb');
                console.log(`Device ${this.type} Starting Listeners`);
                this.rxCharacteristic.startNotifications();
                this.rxCharacteristic.addEventListener('characteristicvaluechanged', this.handleOnMessage);
            } catch (err) {
                console.error(`Error reconnecting to service and characteristics for device ${this.type}:`, err);
            }
        }
    }
    async reconnect() {
        try {
            if (this.gattServer) {
                await this.partialDisconnect();
                await this.partialReconnect();
            } else {
                await this.connect();
            }
        } catch (err) {
            console.error(`Error reconnecting device ${this.type}:`, err);
        } 
    }
    async verifyDevice() {
        try {
            await this.sendBluetoothMessage({ issue: "Device name" });
            const dataString = await this.waitForResponse();
            const data = JSON.parse(dataString);

            if (data.name != this.type) {
                console.log(`Device ${this.type} is not the expected device. Disconnecting...`);
                this.disconnect();
                return false;
            }

            if (data.message && data.message === "Device already registered") {
                createToast("error", "Bluetooth: ", "Device already registered in an account");
                this.disconnect();
                return false;
            }

            // Marcar el dispositivo como verificado
            this.isVerified = true;
            return true;
        } catch (err) {
            console.error("Error during device verification:", err);
            this.disconnect();
            return false;
        }
    }
    async queueOperation(operation) {
        return new Promise((resolve, reject) => {
            this.operationQueue.push({ operation, resolve, reject });
            this.processQueue();
        });
    }
    async processQueue() {
        if (this.isProcessingQueue || this.operationQueue.length === 0) return;
        this.isProcessingQueue = true;
        const { operation, resolve, reject } = this.operationQueue.shift();
        try {
            const result = await operation();
            resolve(result);
        } catch (error) {
            reject(error);
        } finally {
            this.isProcessingQueue = false;
            this.processQueue();
        }
    }
    handleOnMessage=(e)=>{
        const value = new TextDecoder().decode(e.target.value);
        this.messageBuffer += value;
        
        while (this.messageBuffer.includes('|') && this.messageBuffer.includes('#')) {
            const [lengthStr, rest] = this.messageBuffer.split('|', 2);
            const length = parseInt(lengthStr, 10);
            
            if (rest.length >= length + 1) {  // +1 para incluir el '#'
                const jsonStr = rest.substr(0, length);
                const message = JSON.parse(jsonStr);
                console.log('Mensaje completo recibido:', message);
                
                // Procesa el mensaje aquí
                if (this.responseResolver) {
                    this.responseResolver(jsonStr);
                    this.responseResolver = null;
                }
                
                // Elimina el mensaje procesado del buffer
                this.messageBuffer = rest.substr(length + 1);
            } else {
                // No tenemos un mensaje completo aún, esperamos más datos
                break;
            }
        }
    }
    waitForResponse(){
        return new Promise((resolve) => {
            this.responseResolver = resolve;
        });
    }
    async sendBluetoothMessage(data){
        return this.queueOperation(async () => {
            if (data && this.txCharacteristic) {
                const value = JSON.stringify(data);
                const encoder = new TextEncoder();
                await this.txCharacteristic.writeValue(encoder.encode(value));
                console.log(`Sent: ${value}`);
            } else {
                throw new Error("No se puede mandar el mensaje");
            }
        });
    }
  }
