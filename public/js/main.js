import { sleep } from "./vendor/sleep.js";
import { dinamicHTML } from "./vendor/dinamic_html.js";
import { startCursor, startLinks } from "./vendor/cursor.js";
import { initializeLogin } from "./vendor/log_in.js";
import { fetchRequest } from "./vendor/fetch_request.js";
import { initializeToast, createToast } from "./vendor/notification.js";
import { error404 } from "./vendor/error_404.js";
import { faq } from "./vendor/faq.js";
import { connectWebSocket } from "./vendor/web_socket.js";
import { initializeTabs, initializeChangePassword,initializeEditProfile } from "./vendor/edit_profile.js";
import { initializeDevices,addNewDevice } from "./vendor/devices.js";

const d = document,
    w = window,
    body = d.body;

//Funciones generales
const getHTMLElements = function () {
    const $targets = d.querySelectorAll('[data-html]');
    $targets.forEach(el => {
        const url = el.getAttribute('data-html'),
            action = el.getAttribute('data-html-action');
        console.log(`Iniciando peticion en la ruta ${url}`)
        dinamicHTML({
            url: url,
            method: 'GET',
            contentType: 'text/html',
            async success(response) {
                if (response.ok) {//200-299
                    //respuesta exitoso
                    console.log('peticion exitosa')
                    const $html = await response.text();
                    if (action == 'replace') {
                        el.outerHTML = $html;
                        if(url.includes("home_page")){
                            faq();
                        }
                    }
                    else if (action == 'insert') {
                        el.appendChild($html)
                    }
                    else if (action == 'save') {
                        const name = el.getAttribute('data-name');
                        const item = sessionStorage.getItem(name);
                        if (!item) sessionStorage.setItem(name, $html);
                        el.remove();
                    }
                    startLinks();
                }
                else { //300-499
                    console.log('Error en la peticion')
                    console.log(response);
                }
            },
            async error(err) { //500,505
                console.log('Error en la obtencion de datos');
                console.error(err);
            }
        })
    });
};
const redirects = async function ($el, e) {
    e.preventDefault();
    const url = $el.getAttribute('href')
    console.log(url)
    fetchRequest({
        method: 'GET',
        url: url,
        contentType: 'text/html',
        body: null,
        credentials: 'include',
        async success(response) {
            if (response.ok) {    //200-299
                const redirect = $el.getAttribute('data-redirect')
                if (redirect == 'replace-main') {   //cuando el atributo tenga esta valor remplazara la etiqueta main
                    console.log('Remplazando etiqueta main')
                    const $main = d.querySelector('main'),
                        $html = await response.text();
                    $main.outerHTML = $html;
                    //es estos if inicializamos los datos
                    if (url.includes('log_in')) {
                        console.log('log in obtenido')
                        initializeLogin();
                    }
                    else if (url.includes('home_page')) {
                        faq();
                        console.log('home page obtenido');
                        //funcion para inicializar los eventos del home page
                    }
                    else if (url.includes('devices')) {
                        console.log('devices obtenido');
                        initializeDevices();
                    }
                    else if(url.includes("edit_profile")){
                        
                        initializeTabs();
                        initializeChangePassword();
                        initializeEditProfile();

                    }
                }
                else if (redirect == 'submenu') {   //cuando tenga este valor nos traera un submenu de ese enlace
                    console.log('Insertando submenu');
                    const submenu = await response.text(),
                        rect = $el.getBoundingClientRect(),
                        $aux = d.createElement('div');
                    $aux.innerHTML = submenu;

                    if (url.includes('profile_menu')) {
                        const $submenu = $aux.querySelector('.submenu');
                        $submenu.style.setProperty('left', `${rect.right}px`);
                        $el.setAttribute('data-state', 'showing');
                        body.appendChild($submenu);
                    }
                    else if (url.includes('notification_menu')) {
                        const $submenu = $aux.querySelector('.submenu');
                        $submenu.style.setProperty('left', `${rect.right + rect.width}px`);
                        $el.setAttribute('data-state', 'showing');
                        body.appendChild($submenu);
                    }
                    else if (url.includes('another_menu')) {
                        const $submenu = $aux.querySelector('.submenu');
                        $submenu.style.setProperty('left', `${rect.right + rect.width}px`);
                        $el.setAttribute('data-state', 'showing');
                        body.appendChild($submenu);
                    }
                    /*
                    console.log(rect);
                    console.log('Top:', rect.top);
                    console.log('Left:', rect.left);
                    console.log('Right',rect.right);
                    console.log('Buttom',rect.buttom);
                    console.log('Width:', rect.width);
                    console.log('Height:', rect.height);
                    */
                }
            }
            else {//300-499
                error404();
            }
            startLinks();
        },
        async error(err) {   //500
            console.log('Error en la obtencion de datos');
            console.log(err);
        }
    })
}
function removeElement(e) {
    const $target = e.target;
    $target.remove();
}
//funcion para la notificacion
const notification = async function (data) {
    createToast(data.type, data.title, data.text, data.imageUrl);
};
//funcion para inicio, traera la navbar respectivo y a lo mejor otras licencias que necesitemos
const startClient = function () {
    const credentials = sessionStorage.getItem('credentials');
    let url = "";
    if (credentials) {    //si existen hacemos llamado de las cosas del usuario
        //haremos el llamado al navbar de users
        url = "./assets/html/navbar_users.html";
        //aqui tambien haremos el llamado de el buzon de notificacion y demas datos que necesite de primera instancia
        connectWebSocket(); //iniciamos la comunicacion web Socket, solo los usuario tiene acceso a este tipo de notificaciones
        /*
        fetchRequest({
            method:'GET',
            url:`http://${location.hostname}:80/devices`,
            credentials:'include',
            contentType:'application/json',
            data:null,
            async success(response){
                if(response.ok){

                }
                else{

                }
            },
            async error(err){
                console.log("Ocurrio un error");
                console.error(err);
            }
        });
        */
    }
    else {
        //haremos llamado al navba normal
        url = "./assets/html/navbar.html";
    }
    //hacemos la peticion normal
    fetchRequest({
        method: 'GET',
        url: url,
        credentials: 'include',
        contentType: 'text/html',
        data: null,
        async success(response) {
            if (response.ok) {
                const nav = await response.text(),
                    $aux = d.createElement('div');
                $aux.innerHTML = nav;
                const $nav = $aux.querySelector('nav');
                if (credentials) {
                    const data = JSON.parse(credentials)
                    const $user = $nav.querySelector('[data-type="user"] > span');
                    $user.textContent = data.name;
                }
                body.insertAdjacentElement('afterbegin', $nav);
                initializeToast();
            }
            else {
                createToast('error', `Error ${response.status}`, 'Nav not found, please recharge the page');
            }
        },
        async error(err) {
            console.log("Ocurrio un error en la peticion");
            console.error(err);
        }

    });

}

//funcion auxiliar que eliminara la credencial y demas datos de la session en caso de que lo necesitos
const deleteSessionStorage = function () {
    sessionStorage.removeItem('credentials');

    sessionStorage.removeItem('Error 404');
    sessionStorage.removeItem('Home page');
}

const deleteCredentials=function(){
    sessionStorage.removeItem('credentials');
}
//funcion de sign out
function signOut() {
    fetchRequest({
        method: 'GET',
        url: '/sign-out',
        contentType: 'application/json',
        credentials: 'include',
        async success(response) {
            if (response.ok) {
                const data = await response.json();
                if (data.response === 'Sign out successful') {
                    deleteCredentials();
                    window.location.reload();
                }
            }
        },
        async error(err) {
            console.error('Error during sign out:', err);
        }
    });
}

//funcion de editar perfil
function loadEditProfile() {
    fetchRequest({
        method: 'GET',
        url: './assets/html/edit_profile.html',
        contentType: 'text/html',
        credentials: 'include',
        async success(response) {
            if (response.ok) {
                const editProfileHTML = await response.text();
                const $main = d.querySelector('main');
                $main.innerHTML = editProfileHTML;

                // Inicializa las pestañas después de que el contenido se haya cargado
                setTimeout(() => {
                    initializeTabs();
                    initializeChangePassword();
                    initializeEditProfile();
                }, 0);

                // Cierra el menú de perfil si está abierto
                const $submenu = d.querySelector('.submenu');
                if ($submenu) {
                    $submenu.remove();
                }
            } else {
                createToast('error', 'Error', 'Could not load profile edit page');
            }
        },
        error(err) {
            console.error('Error loading edit profile:', err);
            createToast('error', 'Error', 'Could not load profile edit page');
        }
    });
}


//PRUEBA DE AÑADIR DISPOSITIVO
// Función para manejar la adición de nuevos dispositivos
function handleAddDevice() {
    const newDevice = {
        name: "Puerta",
        type: "Electromagnetic Lock",
        state: "offline",
        img: "./assets/img/user.jpg"
    };
    addNewDevice(newDevice);
}
//PRUEBA DE AÑADIR DISPOSITIVO

d.addEventListener('DOMContentLoaded', async e => {
    startCursor();
    startClient();
    getHTMLElements();
    //Funcion de los Botones
    initializeToast();
    body.addEventListener('click', (e) => {
        const $target = e.target;
        console.log($target);
        if ($target.matches('[data-redirect]') || ($target.matches('[data-redirect] *'))) {//para los enlaces del nav
            console.log("redireccionando...");
            //para los que muestren submenus
            console.log($target.closest('a').getAttribute('data-state'))
            if ($target.closest('[data-redirect]').getAttribute('data-state') == 'showing') {  //queremos ocultar el menu
                const $submenu = d.querySelector('.submenu'),
                    $link = $target.closest('[data-redirect]');
                $submenu.classList.add('submenu-out');
                $submenu.addEventListener('animationend', removeElement);
                $link.setAttribute('data-state', 'hidden');
                e.preventDefault();
                return;
            }
            else {   //es otro menu igual removemos el submenu
                const $submenu = d.querySelector('.submenu'),
                    $link = d.querySelector('[data-state="showing"]');
                if ($link) {
                    $link.setAttribute('data-state', 'hidden');
                    console.log($link)
                    if ($submenu) {
                        $submenu.classList.add('submenu-out');
                        $submenu.addEventListener('animationend', removeElement);
                    }
                }

            }
            redirects($target.closest("[data-redirect]"), e);
        }
        if (d.querySelector('.submenu')) {
            const $submenu = d.querySelector('.submenu'),
                $link = d.querySelector('[data-state="showing"]');
            if ($link) {
                $link.setAttribute('data-state', 'hidden');
                console.log($link)
            }
            $submenu.classList.add('submenu-out');
            $submenu.addEventListener('animationend', removeElement);
        }
        if (e.target.matches('#sign-out-btn')) {
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
        if (e.target.matches('#addDeviceButton')) {
            handleAddDevice();
        }
        //PRUEBA DE AÑADIR DISPOSITIVO
    });
    await sleep(1000);

})