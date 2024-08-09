let user = null;
import { sleep } from "./vendor/sleep.js";
import { dinamicHTML } from "./vendor/dinamic_html.js";
import { startCursor, startLinks } from "./vendor/cursor.js";
import { initializeLogin } from "./vendor/log_in.js";
import { fetchRequest } from "./vendor/fetch_request.js";
import { initializeToast, createToast } from "./vendor/notification.js";
import { error404 } from "./vendor/error_404.js";
import { faq } from "./vendor/faq.js";
import { connectWebSocket } from "./vendor/web_socket.js";
import {
  initializeTabs,
  initializeChangePassword,
  initializeEditProfile,
} from "./vendor/edit_profile.js";
import { initializeDevices, addNewDevice } from "./vendor/devices.js";
import { initializateContactUs } from "./vendor/contact_us.js";
import { uuidv4 } from "./vendor/uuidv4.js";

const d = document,
  w = window,
  body = d.body;
const originalUrl = location.href;
//me diran si el usuario existe o no, podre cambiarle sus propiedades desde otros archivos, etc;
console.log(originalUrl);
/*
Archivos front-end que me faltan modificar
notifiaciont.js     Funcion addNotificationToMenu();

*/
export function setUser(newUser) {
  user = newUser;
  console.log(user);
}
export function getUser() {
  return user;
}

export function isAuthenticated() {
  return user !== null;
}
export function setLoadingScreen(text = null) {
  const $screen = d.querySelector(".loader-container"),
    $textContainer = $screen.querySelector("p");
  if (text) {
    //significa que quiere que pongamos texto
    $textContainer.textContent = text;
  } else {
    $textContainer.textContent = "";
  }
  $screen.classList.remove("pointer-events-none", "opacity-0");
}
export function removeLoadingScreen() {
  const $screen = d.querySelector(".loader-container");
  $screen.classList.add("pointer-events-none", "opacity-0");
}
/*
Creamos una clase usuario, esta instancia se va a crear a base de las credenciales de usuario que tengamos, tengra el nombre, 
la ruta de tu foto de perfil, tus dispositivos (datos publicos) , los que estan conectados etc.

*/

class User {
  constructor(name, profile_img) {
    this.name = name;
    this._wsId = null;
    this.profile_img = profile_img;
    this.devices = [];
  }
  getHeader(url) {
    //hacemos la peticion normal
    fetchRequest({
      method: "GET",
      url: url,
      credentials: "include",
      contentType: "text/html",
      data: null,
      async success(response) {
        if (response.ok) {
          const nav = await response.text(),
            $aux = d.createElement("div");
          $aux.innerHTML = nav;
          const $nav = $aux.querySelector("nav");
          if (user.name) {
            const $user = $nav.querySelector('[data-type="user"] > span');
            $user.textContent = user.name;
          }
          if (user.profile_img) {
            //si existe hay una foto de perfil, la inserto
            //NUEVO
            const $userAvatar = $nav.querySelector("#navUserAvatar");
            $userAvatar.src = user.profile_img
              ? `./assets/profile_img/${user.profile_img}`
              : "./assets/img/user.jpg";
            //NUEVO
          }
          body.insertAdjacentElement("afterbegin", $nav);
          initializeToast();
        } else {
          createToast(
            "error",
            `Error ${response.status}`,
            "Nav not found, please recharge the page"
          );
        }
      },
      async error(err) {
        console.log("Ocurrio un error en la peticion");
        console.error(err);
      },
    });
  }
  async getDevices() {
    //obtenemos los dispositivos conectados
    await fetchRequest({
      method: "GET",
      url: `http://${location.hostname}:80/devices`,
      credentials: "include",
      contentType: "application/json",
      data: null,
      async success(response) {
        if (response.ok) {
          const result = await response.json();
          console.log(`peticion http://${location.hostname}:80/devices`);
          console.log(result);
          const { devices } = result;
          devices.forEach((el) => {
            user.devices.push(el);
          });
          console.log(user);
        } else {
        }
      },
      async error(err) {
        console.log("Ocurrio un error");
        console.error(err);
      },
    }); //esperamos que se finalice esta peticion
    //obtenemos los dispositivos conectados
    await fetchRequest({
      method: "GET",
      url: `http://${location.hostname}:80/devices/connected`,
      credentials: "include",
      contentType: "application/json",
      data: null,
      async success(response) {
        if (response.ok) {
          const result = await response.json();
          console.log(
            `peticion http://${location.hostname}:80/devices/connected`
          );
          console.log(result);
          const { devices } = result;
          devices.forEach((dvc) => {
            user.devices.forEach((device) => {
              if (device.device == dvc.device) {
                //es el mismo dispositivo configuramos su estado de conexion
                device.state = "online";
                device.wsId = dvc.ws_id;
              }
            });
          });
          user.devices.forEach((el) => {
            if (!el.state) {
              //si no existe mandamos un mensaje   de que esta desconectado
              el.state = "offline";
              createToast(
                "info",
                "Devices:",
                `Your device '${el.name}' is disconnected`
              );
            } else {
              //esta conectado
              createToast(
                "info",
                "Devices:",
                `Your device '${el.name}' is connected`
              );
            }
          });
        } else {
        }
      },
      async error(err) {
        console.log("Ocurrio un error");
        console.error(err);
      },
    });
    return true; //returnamos true como referencia de que ya acabo la operacion
  }
  modifyPersonalData(name) {
    this.name = name;
  }
  getIdWebSocket() {
    return this._wsId;
  }
  setIdWebSocket(wsId) {
    this._wsId = wsId;
  }
}
/*
class Bluetooth {
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
        this.bluetoothDevice = await navigator.bluetooth.requestDevice({
          filters: [{ services: ["0000ffe0-0000-1000-8000-00805f9b34fb"] }],
        });
        this.bluetoothDevice.addEventListener(
          "gattserverdisconnected",
          this.onDisconnected.bind(this)
        );
        setLoadingScreen("Connecting...");
      }
      if (!this.gattServer || !this.gattServer.connected) {
        console.log("Connecting to GATT Server...");
        this.gattServer = await this.bluetoothDevice.gatt.connect();
      }
      console.log("Getting Service...");
      this.service = await this.gattServer.getPrimaryService(
        "0000ffe0-0000-1000-8000-00805f9b34fb"
      );

      console.log("Getting TX Characteristic...");
      this.txCharacteristic = await this.service.getCharacteristic(
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
        if (!verified) {
          console.log("Dispositivo no autorizado");
          throw new Error("Dispositivo no autorizado");
        }
      }
      this.isConnected = true;
      console.log("Connected!");
      return true;
    } catch (error) {
      console.error("Connection error:", error);
      this.isConnected = false;
      await this.disconnect();
      return false;
    }
  }
  async verifyDevice() {
    try {
      await this.sendMessage({ issue: "Device name" });
      const dataString = await this.waitForResponse();
      const data = JSON.parse(dataString);
      if (data.name !== this.type) {
        console.log(
          `Device ${data.name} is not the expected device (${this.type}). Disconnecting...`
        );
        return false;
      }
      if (data.message && data.message === "Device already registered") {
        createToast(
          "error",
          "Bluetooth: ",
          "Device already registered in an account"
        );
        return false;
      }
      this.isVerified = true;
      return true;
    } catch (err) {
      console.error("Error during device verification:", err);
      return false;
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
let ssem, ssemLA;
//funcion para conectar un dispositivo bluetooth
async function connectBluetooth($target) {
  const $btn = $target;
  const state = $btn.getAttribute("data-state");
  const device = $btn.getAttribute("data-type-device");
  if (state === "disconnected") {
    console.log("Conectando dispositivo Bluetooth...");
    let connected = false;
    try {
      if (device === "SSEM") {
        ssem = new Bluetooth(device);
        connected = await ssem.connect();
      } else if (device === "SSEM_LA") {
        ssemLA = new Bluetooth(device);
        connected = await ssemLA.connect();
      }
      removeLoadingScreen();
      if (connected) {
        console.log("Conexión exitosa");
        createToast(
          "success",
          "Bluetooth: ",
          "Successful connection to Bluetooth device"
        );
        $btn.setAttribute("data-state", "connected");
      } else {
        console.log("No se pudo conectar al dispositivo");
        createToast(
          "error",
          "Bluetooth: ",
          "Failed to connect to Bluetooth device"
        );
      }
    } catch (error) {
      console.error("Error de conexión:", error);
      createToast(
        "error",
        "Bluetooth: ",
        "Error connecting to Bluetooth device"
      );
      removeLoadingScreen();
    }
  } else if (state === "connected") {
    console.log("Desconectando dispositivo Bluetooth...");
    try {
      if (device === "SSEM") {
        await ssem.disconnect();
        ssem = null;
      } else if (device === "SSEM_LA") {
        await ssemLA.disconnect();
        ssemLA = null;
      }
      $btn.setAttribute("data-state", "disconnected");
    } catch (error) {
      console.error("Error de desconexión:", error);
      createToast(
        "error",
        "Bluetooth: ",
        "Error disconnecting from Bluetooth device"
      );
    }
  }
}
//funcion para mandar el formulario de agregar dispositivo
async function handleAddDeviceSubmit(e) {
  const $form = e.target.closest("form");
  setLoadingScreen("Configuring device, please wait...");
  //ssem = new Bluetooth("SSEM");
  if (!ssem) {
    await sleep(750);
    createToast("error", "Bluetooth: ", "Both devices must be conected");
    removeLoadingScreen();
    return;
  }
  const id = uuidv4();
  const user = getUser();
  const webCredentials = {
    id: id,
    name: $form.device_name.value,
    device: null,
    type: "SSEM",
  };
  const ssemCredentials = {
    issue: "Set credentials",
    id: id,
    password: $form.device_password.value,
    ssid: $form.ssid_name.value,
    ssid_password: $form.ssid_password.value,
  };
  const ssemLACredentials = {
    issue: "Set credentials",
    body: {
      ssid: $form.ssid_name.value,
      ssid_password: $form.ssid_password.value,
    },
  };
  /*
  //enviamos las credenciales al dispositivo SSEM LA
  try {
    console.log("Sending Bluetooth data to SSEM...");
    await ssemLA.sendMessage(ssemLACredentials);
    console.log("Waiting for SSEM response...");
    const data = await ssemLA.waitForResponse();
    console.log("Bluetooth data received from SSEM", data);
    if (data.issue !== "Set credentials" || data.state !== "OK") {
      throw new Error("A problem occurred while configuring the SSEM device");
    }
  } catch (err) {
    console.error(`Error during device configuration`, err);
    createToast("error", "Bluetooth: ", "Error during SSMLA device configuration");
    removeLoadingScreen();
    return;
  }
  //
  //enviamos las credenciales al dispositivo SSEM
  try {
    await ssem.sendMessage(ssemCredentials);
    const dataString = await ssem.waitForResponse();
    const data = JSON.parse(dataString);
    if (data.issue != "Set credentials" && data.state != "OK") {
      throw new Error("A problem occurred while configuring the SSEM device");
    }
    /*
    console.log(ssemCredentials);
    const wasSent=await ssem.connect("Set credentials",ssemCredentials);
    if(!wasSent){
      throw new Error("A problem occurred while configuring the SSEM device");
    }
      //
  } catch (err) {
    console.error(`Error during device configuration`, err);
    createToast(
      "error",
      "Bluetooth: ",
      "Error during SSEM device configuration"
    );
    removeLoadingScreen();
    return;
  }

  let savedCredentials = false;
  //Hago la peticion fech para ver si
  await fetchRequest({
    url: `http://${location.hostname}/devices`,
    method: "POST",
    data: JSON.stringify(webCredentials),
    contentType: "application/json",
    async success(response) {
      if (response.ok) {
        const result = response.json();
        webCredentials.device = result.deviceNumber;
        savedCredentials = true;
      }
    },
    async error(err) {
      console.log("error de servidor");
      console.error(err);
    },
  });
  if (!savedCredentials) {
    //si entra a este if el usuario no se ha creado de manera correcta
    removeLoadingScreen();
    createToast("error", "Error: ", "problem creating device on server");
    return;
  }
  //enviamos las credenciales al dispositivo SSEM_LA cuando este la prubea completa lo descomentamos

  // Si todo está bien confirmamos que se guardó el dispositivo
  const { name, type, device } = webCredentials;
  const newDevice = {
    name,
    type,
    device,
    img: "./assets/img/user.jpg",
    state: "offline",
  };

  user.devices.push(newDevice);
  setUser(user);
  addNewDevice(newDevice);
  removeLoadingScreen();
  createToast("success", "Device: ", "Device added successfully");
  console.log("Device added");
}
*/
//funcion para inicio, traera la navbar respectivo y a lo mejor otras licencias que necesitemos
const startClient = async function () {
  const credentials = sessionStorage.getItem("credentials");
  if (credentials) {
    //si existen hacemos llamado de las cosas del usuario
    //haremos el llamado al navbar de users
    const url = "./assets/html/navbar_users.html";
    //instanciamos el objeto
    const { name, profile_img } = JSON.parse(credentials);
    user = new User(name, profile_img); //instanciamos la clase
    console.log("usuario creado");
    console.log(user);
    //aqui tambien haremos el llamado de el buzon de notificacion y demas datos que necesite de primera instancia
    user.getHeader(url);
    await user.getDevices(); //esperamos a obtener los dispositivos conectados
    connectWebSocket(); //iniciamos la comunicacion web Socket, solo los usuario tiene acceso a este tipo de notificaciones
  } else {
    //haremos llamado al navba normal
    const url = "./assets/html/navbar.html";
    //instanciamos un cliente nada mas
    user = new User(null, null); //instanciamos la clase
    user.getHeader(url);
  }

  return true;
};

//Funciones generales
const startContent = async function () {
  //Verificamos si la hay una ruta existente
  const redirect = {
    route: "",
    href: "",
  };
  if (sessionStorage.getItem("route")) {
    const data = JSON.parse(sessionStorage.getItem("route")),
      $main = d.querySelector("main"),
      { route, href } = data;
    $main.setAttribute("data-html", href);
    console.log(data);
    redirect.route = route;
    redirect.href = href;
  } else {
    redirect.route = "/home";
    redirect.href = "./assets/html/home_page.html";
  }
  const $a = d.createElement("a"),
    { route, href } = redirect;
  $a.setAttribute("href", href);
  $a.setAttribute("data-redirect", "replace-main");
  await redirects($a, null);
  //comentar esta linea en live server
  history.replaceState(null, "", route);
  return true;
};

const submenuFunction = function (e) {
  e.preventDefault();
  const $link = e.target.closest("[data-submenu]"),
    selector = $link.getAttribute("data-submenu"),
    $submenu = d.getElementById(selector),
    rect = $link.getBoundingClientRect(),
    rectSub = $submenu.getBoundingClientRect(),
    state = $link.getAttribute("data-state");
  console.log("Funcion submenu");
  if (state == "hidden") {
    //queremos abrir el submenu
    console.log("insertando menu");
    $submenu.classList.replace("submenu-out", "submenu-in");
    $link.setAttribute("data-state", "showing");
    $submenu.classList.remove("pointer-events-none");
  } else if (state == "showing") {
    console.log("retirando menu");
    $submenu.classList.replace("submenu-in", "submenu-out");
    $link.setAttribute("data-state", "hidden");
    $submenu.classList.add("pointer-events-none");
  }
  if (selector == "notificationSubmenu" || selector == "profileMenu") {
    $submenu.style.setProperty("left", `${rect.right - rectSub.width}px`);
  }
};
const initializateSubmenu = function (submenu, $el) {
  const $submenu = submenu,
    $link = $el;
  const selector = $link.getAttribute("data-submenu");
  $link.addEventListener("click", submenuFunction);
  $link.removeAttribute("data-redirect");
  $link.setAttribute("data-state", "showing");
  body.addEventListener("click", function (e) {
    if (
      e.target != $submenu &&
      $submenu.classList.contains("submenu-in") &&
      e.target != d.querySelector(`[data-submenu="${selector}"]`) &&
      e.target != d.querySelector(`[data-submenu="${selector}"] *`)
    ) {
      console.log("retirando submenu, click en otra cosa");
      $link.setAttribute("data-state", "hidden");
      $submenu.classList.replace("submenu-in", "submenu-out");
      $submenu.classList.add("pointer-events-none");
    }
  });
  body.appendChild($submenu);
};

//falta generar un item en sessionStorage, y cambiar la url para que indique que estamos en esa seccion
//y en caso de recargar la pagina aparezcamos en esa seccion

const redirects = async function ($el, e = null) {
  if (e) e.preventDefault();
  const url = $el.getAttribute("href");
  const redirect = $el.getAttribute("data-redirect");
  console.log(url);
  if (redirect == "replace-main") {
    setLoadingScreen("Loading...");
  }
  await fetchRequest({
    method: "GET",
    url: url,
    contentType: "text/html",
    body: null,
    credentials: "include",
    async success(response) {
      if (response.ok) {
        //200-299
        if (redirect == "replace-main") {
          //cuando el atributo tenga esta valor remplazara la etiqueta main
          console.log("Remplazando etiqueta main");
          const $main = d.querySelector("main"),
            $html = await response.text(),
            redirect = {
              route: "",
              href: "",
            };
          $main.outerHTML = $html;
          redirect.href = url;
          //es estos if inicializamos los datos
          if (url.includes("log_in")) {
            redirect.route = "/sign-in";
            console.log("log in obtenido");
            initializeLogin();
          } else if (url.includes("home_page")) {
            console.log("home page obtenido");
            redirect.route = "/home";
            faq();
            //funcion para inicializar los eventos del home page
          } else if (url.includes("devices")) {
            console.log("devices obtenido");
            redirect.route = "/my-devices";
            initializeDevices();
          } else if (url.includes("edit_profile")) {
            console.log("edit profile obtenido");
            redirect.route = "/my-profile";
            initializeTabs();
            initializeChangePassword();
            initializeEditProfile();
          }
          //COMENTAR LA LINEA DE ABAJO SI ESTAN EN LIVE SERVER
          history.replaceState(null, "", redirect.route);
          sessionStorage.setItem("route", JSON.stringify(redirect));
          removeLoadingScreen();
        } else if (redirect == "submenu") {
          //cuando tenga este valor nos traera un submenu de ese enlace
          //como queremos obtimizar ya no lo volveremos a traer y ya solo controlaremos sus eventos
          console.log("Insertando submenu");
          const submenu = await response.text(),
            rect = $el.getBoundingClientRect(),
            $aux = d.createElement("div");
          $aux.innerHTML = submenu;
          const $submenu = $aux.querySelector(".submenu"),
            $auxSub = $submenu.cloneNode(true);
          $auxSub.classList.add("pointer-events-none", "opacity-0");
          body.appendChild($auxSub);
          const rectSub = $auxSub.getBoundingClientRect();
          $auxSub.remove();
          if (url.includes("profile_menu")) {
            $submenu.style.setProperty(
              "left",
              `${rect.right - rectSub.width}px`
            );
          } else if (url.includes("notification_menu")) {
            $submenu.style.setProperty(
              "left",
              `${rect.right - rectSub.width}px`
            );
          } else if (url.includes("another_menu")) {
            $submenu.style.setProperty(
              "left",
              `${rect.left - rectSub.width}px`
            );
          }
          initializateSubmenu($submenu, $el);
          /*
                    console.log(rect);
                    console.log('Top:', rect.top);
                    console.log('Left:', rect.left);
                    console.log('Right',rect.right);
                    console.log('Buttom',rect.buttom);
                    console.log('Width:', rect.width);
                    console.log('Height:', rect.height);
                    */
        } else if (redirect == "modal-section") {
          console.log("Insertando elemento modal");
          const $html = await response.text(),
            $main = d.querySelector("main"),
            $aux = d.createElement("div");
          $aux.innerHTML = $html;
          const $modal = $aux.querySelector("[data-modal-section]");
          $main.after($modal);
          $el.removeAttribute("data-redirect");
          if (url.includes("contact_us")) {
            initializateContactUs();
          }
        }
      } else {
        //300-499
        error404();
      }
      startLinks();
    },
    async error(err) {
      //500
      console.log("Error en la obtencion de datos");
      console.log(err);
    },
  });
  return true;
};
function removeElement(e) {
  const $target = e.target;
  $target.remove();
}
//funcion para la notificacion
const notification = async function (data) {
  createToast(data.type, data.title, data.text, data.imageUrl);
};
//funcion auxiliar que eliminara la credencial y demas datos de la session en caso de que lo necesitos
const deleteSessionStorage = function () {
  sessionStorage.removeItem("credentials");

  sessionStorage.removeItem("Error 404");
  sessionStorage.removeItem("Home page");
};

const deleteCredentials = function () {
  sessionStorage.removeItem("credentials");
};
//funcion de sign out
function signOut() {
  fetchRequest({
    method: "GET",
    url: "/sign-out",
    contentType: "application/json",
    credentials: "include",
    async success(response) {
      if (response.ok) {
        const data = await response.json();
        if (data.response === "Sign out successful") {
          deleteCredentials();
          sessionStorage.removeItem("route");
          location.reload();
        }
      }
    },
    async error(err) {
      console.error("Error during sign out:", err);
    },
  });
}

//PRUEBA DE AÑADIR DISPOSITIVO
// Función para manejar la adición de nuevos dispositivos
function handleAddDevice() {
  const newDevice = {
    name: "Puerta",
    type: "Electromagnetic Lock",
    state: "offline",
    img: "./assets/img/user.jpg",
    device: 1,
  };
  addNewDevice(newDevice);
}
//PRUEBA DE AÑADIR DISPOSITIVO

d.addEventListener("DOMContentLoaded", async (e) => {
  startCursor();
  await startClient();
  startContent();
  //Funcion de los Botones
  initializeToast();
  body.addEventListener("click", (e) => {
    const $target = e.target;
    console.log($target);
    if (
      $target.matches("[data-redirect]") ||
      $target.matches("[data-redirect] *")
    ) {
      //para los enlaces del nav
      console.log("redireccionando...");
      //para los que muestren submenus
      redirects($target.closest("[data-redirect]"), e);
    }
    if (e.target.matches("#sign-out-btn")) {
      e.preventDefault();
      signOut();
    }
    /*
        if (e.target.matches('#edit-profile-btn') || e.target.closest('#edit-profile-btn')) {
            e.preventDefault();
            loadEditProfile();
        }
            */

    //PRUEBA DE AÑADIR DISPOSITIVO
    if ($target.matches("#addDeviceButton")) {
      handleAddDevice();
    }
    //PRUEBA DE AÑADIR DISPOSITIVO
    //PRUEB PARA INICIAR CONEXION BLUETOOTH
    if ($target.matches("#connectBluetooth")) {
      tryBluetoothConnection();
    }
  });
});
