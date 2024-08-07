const d=document,
        n=navigator
import {createToast} from "./notification.js";
class Bluetooth {
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
    }
    async connect(){
        console.log(`Conectando a bluetooth device ${this.type}`);
        try {
            this.bluetooth=await n.bluetooth.requestDevice({
                filters: [{ services: ['0000ffe0-0000-1000-8000-00805f9b34fb'] }]
            });
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
            //empezamos con la verificacion del dispositivo
            await this.sendBluetoothMessage({issue:"Device name"});
            const dataString= await this.waitForResponse(),
                    data=JSON.parse(dataString);
            if(data.name != this.type){
                console.log(`Device ${this.type} is not the expected device. Disconnecting...`);
                this.disconnect();
                return false;
            }
            console.log(`Device ${this.type} connected and verified!`);
            return true;
        } catch (err) {
            console.error(`Error connecting to device ${this.type}:`, err);
            this.disconnect();
            return false;
        }
    }
    disconnect(){
        if (this.bluetooth && this.bluetooth.gatt.connected) {
            this.bluetooth.gatt.disconnect();
            console.log('Disconnected!');
        }
    }
    handleOnMessage=(e)=>{
        const value = new TextDecoder().decode(e.target.value); 
        console.log('Received: ' + value);
        if (this.responseResolver) {
            this.responseResolver(value);
            this.responseResolver = null;
        }
    }
    waitForResponse(){
        return new Promise((resolve) => {
            this.responseResolver = resolve;
        });
    }
    async sendBluetoothMessage(data){
        if(data && this.txCharacteristic){
            const value=JSON.stringify(data);
            const encoder = new TextEncoder();
            await this.txCharacteristic.writeValue(encoder.encode(value));
            console.log(`Sent: ${value}`);
        }
        else{
            console.error("No se puede mandar el mensaje");
        }
    }
  }


export async function tryBluetoothConnection(name) {
    try {
        const bt = new Bluetooth(name);
        const connected = await bt.connect();
        if (connected) {
            console.log("Conexión exitosa y verificada");
            createToast("success","Bluetooth: ","Successful connection to bluetooth device");
            //retornamos el objeto bluetooth
            return bt;
        } else {
            console.log("No se pudo conectar o verificar el dispositivo");
            createToast("error","Bluetooth: ","Failed to connect to bluetooth device");
            return null;
        }
    } 
    catch (err) {
        console.error(err);
        createToast("error","Bluetooth: ","Failed to connect to bluetooth device");
        return null;
    }  
}