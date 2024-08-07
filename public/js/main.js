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
import {initializeTabs,initializeChangePassword,initializeEditProfile} from "./vendor/edit_profile.js";
import { initializeDevices, addNewDevice } from "./vendor/devices.js";
import { initializateContactUs } from "./vendor/contact_us.js";


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
export function setLoadingScreen(text=null){
  const $screen=d.querySelector(".loader-container"),
        $textContainer=$screen.querySelector("p");
  if(text){ //significa que quiere que pongamos texto
    $textContainer.textContent=text;
  }
  else{
    $textContainer.textContent="";
  }
  $screen.classList.remove("pointer-events-none","opacity-0");
}
export function removeLoadingScreen(){
  const $screen=d.querySelector(".loader-container");
  $screen.classList.add("pointer-events-none","opacity-0");
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
          if(user.profile_img){ //si existe hay una foto de perfil, la inserto
            //NUEVO
            const $userAvatar = $nav.querySelector('#navUserAvatar');
            $userAvatar.src = user.profile_img ? `./assets/profile_img/${user.profile_img}` : "./assets/img/user.jpg";
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
const startContent =async function () {
  //Verificamos si la hay una ruta existente
  const redirect={
    route:'',
    href:''
  }
  if(sessionStorage.getItem("route")){
    const data=JSON.parse(sessionStorage.getItem('route')),
          $main=d.querySelector("main"),
          {route,href}=data;
    $main.setAttribute("data-html",href);
    console.log(data);
    redirect.route=route;
    redirect.href=href;
  }
  else{
    redirect.route="/home";
    redirect.href="./assets/html/home_page.html";
  }
  const $a=d.createElement('a'),
        {route,href}=redirect
  $a.setAttribute('href',href);
  $a.setAttribute('data-redirect',"replace-main");
  await redirects($a,null);
  //comentar esta linea en live server
  history.replaceState(null, '', route);
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
  if(selector=="notificationSubmenu" || selector=="profileMenu"){
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

const redirects = async function ($el, e=null) {
  if(e)e.preventDefault();
  const url = $el.getAttribute("href");
  const redirect = $el.getAttribute("data-redirect");
  console.log(url);
  if(redirect == "replace-main"){
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
            redirect={
              route:"",
              href:""
            }
          $main.outerHTML = $html;
          redirect.href=url;
          //es estos if inicializamos los datos
          if (url.includes("log_in")) {
            redirect.route="/sign-in";
            console.log("log in obtenido");
            initializeLogin();
          } else if (url.includes("home_page")) {
            console.log("home page obtenido");
            redirect.route="/home";
            faq();
            //funcion para inicializar los eventos del home page
          } else if (url.includes("devices")) {
            console.log("devices obtenido");
            redirect.route="/my-devices";
            initializeDevices();
          } else if (url.includes("edit_profile")) {
            console.log("edit profile obtenido");
            redirect.route="/my-profile";
            initializeTabs();
            initializeChangePassword();
            initializeEditProfile();
          }
          //COMENTAR LA LINEA DE ABAJO SI ESTAN EN LIVE SERVER
          history.replaceState(null, '', redirect.route);
          sessionStorage.setItem("route",JSON.stringify(redirect));
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
    device:1,
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
    if (e.target.matches("#addDeviceButton")) {
      handleAddDevice();
    }
    //PRUEBA DE AÑADIR DISPOSITIVO
    //PRUEB PARA INICIAR CONEXION BLUETOOTH
    if (e.target.matches("#connectBluetooth")) {
      tryBluetoothConnection();
    }


  });
});
