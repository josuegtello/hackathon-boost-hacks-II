const n = navigator;
import { createToast } from "./notification.js";
import { sleep } from "./sleep.js";
import {setLoadingScreen,removeLoadingScreen} from "../main.js";


export class Bluetooth {
  constructor(type) {
    this.type = type;
    this.bluetoothDevice = null;
    this.gattServer = null;
    this.service = null;
    this.txCharacteristic = null;
    this.rxCharacteristic = null;
    this.messageBuffer = "";
    this.responseResolver = null;
    this.isConnected = false;
    this.isVerified = false;
    this.isProcessingQueue = false;
    this.operationQueue = [];
    this.operationTimeout = 30000; // Aumentado a 30 segundos
  }
  async connect(issue = null, data = null) {
    if (this.isConnected && this.gattServer?.connected && !issue) {
      console.log("Device already connected.");
      return true;
    }
    // Reinicializar la conexión si está desconectada
    if (
      this.bluetoothDevice &&
      (!this.gattServer || !this.gattServer.connected)
    ) {
      console.log("Reconnecting to device...");
      this.gattServer = null;
      this.service = null;
      this.txCharacteristic = null;
      this.rxCharacteristic = null;
    }
    try {
      if (!this.bluetoothDevice) {
        console.log("Requesting Bluetooth Device...");
        this.bluetoothDevice = await n.bluetooth.requestDevice({
          filters: [{ services: ["0000ffe0-0000-1000-8000-00805f9b34fb"] }],
        });
        this.bluetoothDevice.addEventListener(
          "gattserverdisconnected",
          this.onDisconnected.bind(this)
        );
      }
      setLoadingScreen("Connecting...");
      if (!this.gattServer || !this.gattServer.connected) {
        console.log("Connecting to GATT Server...");
        this.gattServer = await this.bluetoothDevice.gatt.connect();
      }
      console.log("Getting Service...");
      this.service = await this.gattServer.getPrimaryService( /*   FFE0    */
        "0000ffe0-0000-1000-8000-00805f9b34fb"
      );

      console.log("Getting TX Characteristic...");
      this.txCharacteristic = await this.service.getCharacteristic(/*FFE1 */
        "0000ffe1-0000-1000-8000-00805f9b34fb"
      );

      console.log("Getting RX Characteristic...");
      this.rxCharacteristic = await this.service.getCharacteristic(
        "0000ffe1-0000-1000-8000-00805f9b34fb"
      );

      console.log("Starting notifications...");
      this.rxCharacteristic.startNotifications();
      this.rxCharacteristic.addEventListener(
        "characteristicvaluechanged",
        this.handleOnMessage
      );

      if (!this.isVerified) {
        console.log("Empezando verificacion de dispositivo");
        const verified = await this.verifyDevice();
        console.log("verificacion de dispositivo",verified);
        if(verified.registred) throw new Error("Dispositivo ya registrado");
        if (!verified.state) {
          console.log("Dispositivo no autorizado");
          throw new Error("Dispositivo no autorizado");
        }
        else{
          console.log("Dispositivo autorizado");
          this.isVerified = true;
        }
      }
      this.isConnected = true;
      console.log("Connected!");
      createToast("success","Bluetooth: ","Successful connection to Bluetooth device");
      return true;
    } catch (error) {
      console.error("Connection error:", error);
      if(error.message.includes("Dispositivo ya registrado")){
        createToast("error","Error: ","Device already registered in an account");
      }
      else{
        createToast("error","Bluetooth: ","Failed to connect to Bluetooth device");
      }
      this.isConnected = false;
      await this.disconnect();
      return false;
    }
  }
  async verifyDevice() {
    try {
      console.log("Verificando dispositivo");
      await this.sendMessage({ issue: "Device name" });
      const dataString = await this.waitForResponse();
      const data = JSON.parse(dataString);
      console.log(data.message);
      if (data.message == "Device already registred") {
        console.log("Dispositivo ya registrado");
        return {state:false,registred:true};
      }
      if (data.name !== this.type) {
        console.log(
          `Device ${data.name} is not the expected device (${this.type}). Disconnecting...`
        );
        return {state:false,registred:false};
      }
      return {state:true,registred:false};
    } catch (err) {
      console.error("Error during device verification:", err);
      return {state:false,registred:false};
    }
  }
  onDisconnected(event) {
    console.log("Bluetooth Device disconnected");
    this.isConnected = false;
    this.gattServer = null;
    this.service = null;
    this.txCharacteristic = null;
    this.rxCharacteristic = null;
  }

  async disconnect() {
    if (this.gattServer && this.gattServer.connected) {
      await this.gattServer.disconnect();
    }
    this.onDisconnected();
    console.log("Disconnected!");
  }

  async sendMessage(data) {
    return this.queueOperation(async () => {
      if (data && this.txCharacteristic) {
        const value = JSON.stringify(data);
        const encoder = new TextEncoder();
        const encodedValue = encoder.encode(value);

        // Dividir el mensaje en fragmentos de 20 bytes
        const chunkSize = 20;
        for (let i = 0; i < encodedValue.length; i += chunkSize) {
          const chunk = encodedValue.slice(i, i + chunkSize);
          await this.writeChunk(chunk);
          // Pequeña pausa entre escrituras para evitar sobrecarga
          await new Promise((resolve) => setTimeout(resolve, 50));
        }

        console.log(`Sent: ${value}`);
      } else {
        throw new Error("No se puede mandar el mensaje");
      }
    });
  }

  async writeChunk(chunk) {
    let retries = 3;
    while (retries > 0) {
      try {
        await this.txCharacteristic.writeValue(chunk);
        return;
      } catch (error) {
        console.warn(`Error writing chunk, retries left: ${retries}`, error);
        retries--;
        if (retries === 0) {
          throw error;
        }
        // Esperar antes de reintentar
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }
  }
  handleOnMessage = (e) => {
    const value = new TextDecoder().decode(e.target.value);
    this.messageBuffer += value;

    while (
      this.messageBuffer.includes("|") &&
      this.messageBuffer.includes("#")
    ) {
      const [lengthStr, rest] = this.messageBuffer.split("|", 2);
      const length = parseInt(lengthStr, 10);

      if (rest.length >= length + 1) {
        // +1 para incluir el '#'
        const jsonStr = rest.substr(0, length);
        const message = JSON.parse(jsonStr);
        console.log("Mensaje completo recibido:", message);

        if (this.responseResolver) {
          this.responseResolver(jsonStr);
          this.responseResolver = null;
        }

        this.messageBuffer = rest.substr(length + 1);
      } else {
        break;
      }
    }
  };

  async waitForResponse(timeout = 20000) {
    return new Promise((resolve, reject) => {
      this.responseResolver = resolve;
      setTimeout(() => {
        if (this.responseResolver) {
          this.responseResolver = null;
          reject(new Error("Response timeout"));
        }
      }, timeout);
    });
  }

  async queueOperation(operation) {
    return new Promise((resolve, reject) => {
      this.operationQueue.push({ operation, resolve, reject });
      if (!this.isProcessingQueue) {
        this.processQueue();
      }
    });
  }

  async processQueue() {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;
    while (this.operationQueue.length > 0) {
      const { operation, resolve, reject } = this.operationQueue.shift();
      try {
        const result = await Promise.race([
          operation(),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("Operation timeout")),
              this.operationTimeout
            )
          ),
        ]);
        resolve(result);
      } catch (error) {
        console.error("Operation error:", error);
        reject(error);
      }
    }
    this.isProcessingQueue = false;
  }
}