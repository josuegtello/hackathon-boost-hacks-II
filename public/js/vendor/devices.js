import {setUser,getUser,setLoadingScreen,removeLoadingScreen} from "../main.js";
import {sendWebSocketMessage} from "./web_socket.js";
import {Bluetooth} from "./bluetooth.js";
import {createToast} from "./notification.js";
import { sleep } from "./sleep.js";
import {uuidv4} from "./uuidv4.js";
import {fetchRequest} from "./fetch_request.js";
const d = document;

export function initializeDevices() {
    initializeTabs();
    initializeDeviceSection();
    initializeDashboard();
    initializeCardModal();
    initializePasswordModal();
    initializeAddDeviceForm();
    //testConnection();
    /*
    // Añade evento al botón de prueba para dar clic a un decives y ser redireccionado al dashboard
    const testButton = d.getElementById('testDeviceButton');
    if (testButton) {
        testButton.addEventListener('click', testAddAndSelectDevice);
    }
        */
}

// SECCION DE TABS
function initializeTabs() {
    const $tabs = d.querySelectorAll('.devices-nav li');
    $tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            const target = this.getAttribute('data-tab');
            setActiveTab(target);
        });
    });
    // Activar el primer tab por defecto
    if ($tabs.length > 0) {
        const firstTabId = $tabs[0].getAttribute('data-tab');
        setActiveTab(firstTabId);
    }
}
function setActiveTab(tabId) {
    const $tabs = d.querySelectorAll('.devices-nav li');
    const $tabContents = d.querySelectorAll('.devices-tab');
    $tabContents.forEach(content => content.classList.remove('devices-active'));
    $tabs.forEach(tab => tab.classList.remove('devices-active'));

    const activeTab = d.querySelector(`[data-tab="${tabId}"]`);
    const activeContent = d.getElementById(tabId);

    if (activeTab && activeContent) {
        activeTab.classList.add('devices-active');
        activeContent.classList.add('devices-active');
    }
}
// SECCION DE DEVICES

//Función para crear/añadir el contenedor del dispositivo
function createDeviceElement(data) {
    const deviceElement = d.createElement('div');
    deviceElement.classList.add('device-n');
    deviceElement.setAttribute("data-device",data.device);
    console.log("Crenado etiqueta device");
    console.log(data);
    deviceElement.innerHTML = `
        <figure class="tab-device-img">
            <img src="${data.img}" alt="Device image">
        </figure>
        <div class="tab-device-content">
            <input type="text" placeholder="${data.name}" name="Name device" disabled data-original-value="${data.name}">
            <h4>${data.type}</h4>
            <span class="${data.state === 'online' ? 'online-icon' : 'offline-icon'}">
                <i class="fa-solid fa-circle"></i>${data.state == 'online' ? 'Online' : 'Offline'}
            </span>
        </div>
        <div class="tab-device-icons">
            <i class="fas fa-pencil-alt"></i>
            <i class="fas fa-trash-alt"></i>
        </div>
    `;

    // Agregar evento de clic al elemento del dispositivo
    deviceElement.addEventListener('click', (e) => handleDeviceClick(e, data));

    return deviceElement;
}
//Función para añadir un dipositivo
export function addNewDevice(device) {
    const $devicesContainer = d.querySelector('.tab-container-devices');
    const deviceElement = createDeviceElement(device);
    $devicesContainer.appendChild(deviceElement);

    const $input = deviceElement.querySelector('input[type="text"]');
    const $editIcon = deviceElement.querySelector('.fa-pencil-alt');
    const $deleteIcon = deviceElement.querySelector('.fa-trash-alt');

    $editIcon.addEventListener('click', handleEditClick);
    $deleteIcon.addEventListener('click', handleDeleteClick);
    $input.addEventListener('keydown', handleInputKeydown);
}
export function setDevice(data){
    if(!d.querySelector('.tab-container-devices')) return;
    const {device,state,name}=data;
    const $device=d.querySelector(`[data-device="${device}"]`)
    if(state){  //si existe cambiamos el estado
        const $stateContainer=$device.querySelector("span");
        $stateContainer.className="";//limpliamos la lista de clases
        $stateContainer.classList.add(state === 'online' ? 'online-icon' : 'offline-icon');
        $stateContainer.innerHTML=`<i class="fa-solid fa-circle"></i>${state == 'online' ? 'Online' : 'Offline'}`;
        
    }
    if(name){   //si existe cambiamos el nombre
        const $input=$device.querySelector('input');

        $input.setAttribute("placeholder",name);
    }

}

//función que se ejecuta cuando se hace clic en el contenedor del dispositivo
function handleDeviceClick(e, deviceData) {
    // Verificar si el clic fue en un elemento que no debe activar el dashboard
    if (
        e.target.matches('.fa-pencil-alt') ||
        e.target.matches('.fa-trash-alt') ||
        e.target.matches('input[type="text"]') ||
        e.target.closest('.tab-device-icons')
    ) {
        // No hacer nada si el clic fue en estos elementos
        return;
    }
    console.log("Abriendo dashboard de dispositivo:", deviceData);
    updateDashboard(deviceData);
    setActiveTab('dashboard');
}

/* // Función de prueba para añadir y seleccionar un dispositivo
function testAddAndSelectDevice() {
    const testDevice = {
        name: "Test Device",
        type: "Test Type",
        state: "online",
        device: "test123",
        img: "./assets/img/user.jpg",
        alarm: 'on',
        lock: 'locked',
        password: 'testpass'
    };

    // Añadir el dispositivo
    addNewDevice(testDevice);
}

 */
//función de prueba para actualizar la información en la sección del dashboard
export function updateDashboard(deviceData) {
    const $dashboardSection = d.getElementById('dashboard');
    const $deviceNameElement = $dashboardSection.querySelector('.device-name-dashboard');
    $deviceNameElement.textContent = deviceData.name;
    //vamos a setear data atributes
    $dashboardSection.setAttribute("data-device-dashboard",deviceData.device);
    $dashboardSection.setAttribute("data-ws-id",deviceData.wsId?deviceData.wsId:"");
    $dashboardSection.setAttribute("data-state",deviceData.state);
    // Actualizar el estado del botón de alarma
    const alarmButton = $dashboardSection.querySelector('.btn-dashboard:nth-child(1)');
    alarmButton.classList.toggle('active', deviceData.alarm === 'on');

    // Actualizar el estado del botón de cerradura
    const lockButton = $dashboardSection.querySelector('.btn-dashboard:nth-child(2)');
    lockButton.classList.toggle('active', deviceData.lock === 'locked');
    lockButton.querySelector('i').classList.toggle('fa-lock', deviceData.lock === 'locked');
    lockButton.querySelector('i').classList.toggle('fa-lock-open', deviceData.lock === 'unlocked');

    // Actualizar la contraseña mostrada
    const passwordButton = $dashboardSection.querySelector('.btn-dashboard:nth-child(3)');
    passwordButton.querySelector('.see-password-dashboard').textContent = deviceData.password || 'password';




} 
   

function initializeDeviceSection() {
    //creo todos las etiqueta device
    console.log("Agregando dispositivos a la pantalla");
    const user=getUser(),
        {devices}=user;
    devices.forEach(device => {
        const newDevice=device;
        newDevice.img="./assets/img/user.jpg";//FALTA CAMBIAR ESTO QUE DEPENDIENDO DEL TIPO ES LA IMAGEN
        console.log(device);
        addNewDevice(newDevice);

        /* //Pueba para agregar un nuevo dispositivo
        const newDevice = {
            ...device,
            img: "./assets/img/user.jpg",
            alarm: 'off',
            lock: 'unlocked',
            password: '1234'
        };
        console.log(newDevice);
        addNewDevice(newDevice); */
        
    });
    
    const $devices = d.querySelectorAll('.device-n');

    $devices.forEach($device => {
        const $input = $device.querySelector('input[type="text"]');
        const $editIcon = $device.querySelector('.fa-pencil-alt');
        const $deleteIcon = $device.querySelector('.fa-trash-alt');

        $input.setAttribute('data-original-value', $input.value);

        $editIcon.addEventListener('click', handleEditClick);
        $deleteIcon.addEventListener('click', handleDeleteClick);
        $input.addEventListener('keydown', handleInputKeydown);
    });
}




function handleEditClick(event) {
    const $element = event.target.closest('.device-n, .card-info');
    if ($element) {
        const $input = $element.querySelector('input[type="text"]');
        const $editIcon = event.target;
        
        if ($input.disabled) {
            $input.disabled = false;
            $element.classList.add('editing');
            $editIcon.classList.add('editing');
            $input.focus();
        } else {
            saveInputChanges($input);
        }
    }
}

/* function handleDeleteClick(event) {
    const $element = event.target.closest('.device-n, .card-info');
    if ($element && confirm('Are you sure you want to remove this item?')) {
        $element.remove();
        if ($element.classList.contains('card-info')) {
            updateSaveChangesButtonVisibility();
        }
    }
} */

function handleDeleteClick(event) {
    const $cardInfo=event.target.closest(".card-info");
    if($cardInfo){
        showCustomConfirmModal(async () => {
            $cardInfo.remove();
            updateSaveChangesButtonVisibility();
        })
        return;
    }
    
    const $element = event.target.closest('.device-n');
    if ($element) {
        //Si no es ese es para eliminar un dispositivo
        console.log("Eliminando Dispositivo");
        //primero buscamos el dispositivo y vemos si esta online
        const $container=event.target.closest(".device-n"),
            device=Number($container.getAttribute("data-device"));
        console.log($container,device);
        let eliminate=false;
        let position
        const user=getUser();
        user.devices.forEach((dvc,index) => {
            if(dvc.device==device){
                console.log("Dispositivo encontrado");
                console.log(dvc);
                position=index;
                eliminate=true;
            }
        });
        if(!eliminate){
            createToast("info","Devices: ","To delete a device it must be online");

            return;
        }
        showCustomConfirmModal(async () => {
            //hacemos una peticion fecha para eliminar el dispisitivo
            console.log(`Solicitud a http://${location.hostname}/devices`);
            await fetchRequest({
                method:"DELETE",
                url:`http://${location.hostname}/devices`,
                contentType:"application/json",
                data:JSON.stringify({pos:device}),
                async success(response){
                    if(response.ok){    //eliminamos el dispositivo
                        console.log("Dispositivo a eliminar",user.devices[position]);
                        //le decimos al dispositivo web socket que se elimine
                        const wsId=user.devices[position].wsId
                        const message={
                            ws_id:wsId,
                            issue:"send a message to a specific client",
                            body:{
                                issue:"Delete credentials"
                            }
                        }
                        sendWebSocketMessage(message);
                        user.devices.splice(position, 1);
                        setUser(user);
                        $element.remove();
                        createToast("success","Success: ","Device successfully deleted");
                    }
                    else{
                        createToast("error","Error: ","Unauthorized action");
                    }
                },
                async error(err){
                    console.error("Un error ha ocurrido durante la peticion",err);
                    createToast("error","Error: ","An unexpected server error occurred");
                }
            })
           
        });
    }
}
    function showCustomConfirmModal(onConfirm) {
        const modal = document.getElementById('custom-confirm-modal');
        const yesBtn = document.getElementById('custom-confirm-yes');
        const noBtn = document.getElementById('custom-confirm-no');
    
        modal.style.display = 'block';
    
        yesBtn.onclick = function() {
            modal.style.display = 'none';
            onConfirm();
        }
    
        noBtn.onclick = function() {
            modal.style.display = 'none';
        }
    
        window.onclick = function(event) {
            if (event.target == modal) {
                modal.style.display = 'none';
            }
        }
    }

function handleInputKeydown(e) {
    if (e.key === 'Enter') {
        saveInputChanges(this);
    } else if (e.key === 'Escape') {
        cancelInputEdit(this);
    }
}

function saveInputChanges($input) {
    $input.disabled = true;
    const $element = $input.closest('.device-n, .card-info');
    $element.classList.remove('editing');
    const $editIcon = $element.querySelector('.fa-pencil-alt');
    if ($editIcon) {
        $editIcon.classList.remove('editing');
    }

    if ($input.value !== $input.getAttribute('data-original-value')) {
        console.log(`Nuevo valor guardado: ${$input.value}`);
        $input.setAttribute('data-original-value', $input.value);
    }
}

function cancelInputEdit($input) {
    $input.value = $input.getAttribute('data-original-value');
    $input.disabled = true;
    const $element = $input.closest('.device-n, .card-info');
    $element.classList.remove('editing');
    $element.querySelector('.fa-pencil-alt').classList.remove('editing');
}

// Sección del Dashboard
function initializeDashboard() {
    const $dashboardButtons = d.querySelectorAll('.btn-dashboard');
    const $openCardsLink = d.getElementById('open-cards-modal');

    $dashboardButtons.forEach($button => {
        $button.addEventListener('click', handleDashboardButtonClick);
    });

    if ($openCardsLink) {
        $openCardsLink.addEventListener('click', (e) => {
            e.preventDefault();
            openPasswordModal('cards');
        });
    }
}
let device;
async function handleDashboardButtonClick() {
    const $icon = this.querySelector('i');
    const buttonText = this.querySelector('h4').textContent.trim().toLowerCase();
    //(FALTA) ver si esta online el dispositivo para tratar de hacer el cambio, de lo contrario no hacerlo
    const $dashboard=d.querySelector("#dashboard"),
            deviceNumber=Number($dashboard.getAttribute("data-device-dashboard"));
    const user=getUser();
    user.devices.forEach(dvc => {
        if(dvc.device==deviceNumber){
            console.log("Dispositivo IoT encontrado");
            device=dvc;
            console.log(device);
        }
    });
    if(device.state=="offline" || !device){
        // crear un mensaje que diga que si esta offline no se puede hacer ningun accion, preguntarle al Eder si esta bien 
        createToast("error","Devices: ", `Your device "${device.name}" must be online to interact whith it`);
        return;
    }
    try {
        if (buttonText === 'alarm' || buttonText === 'gate lock') {
            
            if(buttonText === 'alarm'){
                //mandamos el mensaje websocket primero antes de actualizar
                const issue=this.classList.contains("active")?"Alarm off":"Alarm on";
                this.classList.toggle('active');
                const response=await sendWebSocketMessage({
                    issue:"send a message to a specific client",
                    ws_id:device.wsId,
                    body:{
                        issue:issue
                    }
                },true)
                const body=response.body
                if(body.issue!=issue && body.state!="OK"){
                    throw new Error("Error en la interpretacion de mensaje");
                }
            }
            if (buttonText === 'gate lock') {
                //(FALTA)mandamos el mensaje websocket primero antes de actualizar
                const issue=this.classList.contains("active")?"Lock on":"Lock off";
                $icon.classList.toggle('fa-lock');
                $icon.classList.toggle('fa-lock-open');
                this.classList.toggle('active');
                const response=await sendWebSocketMessage({
                    issue:"send a message to a specific client",
                    ws_id:device.wsId,
                    body:{
                        issue:issue
                    }
                },true)
                const body=response.body;
                if(body.issue!=issue && body.state!="OK"){
                    throw new Error("Error en la interpretacion de mensaje");
                }
                
            }
            
        } else if (buttonText === 'password') {
            //(FALTA mandar mensaje wbsocket antes de actualizar)
            const $passwordSpan = this.querySelector('.see-password-dashboard');
            $passwordSpan.textContent="Getting password..";
            $passwordSpan.style.display = 'block';
            const issue="Get password";
            const response=await sendWebSocketMessage({
                issue:"send a message to a specific client",
                ws_id:device.wsId,
                body:{
                    issue:issue
                }
            },true)
            const body=response.body
            if(body.issue!=issue && body.state!="OK"){
                $passwordSpan.style.display = 'none';
                throw new Error("Error en la interpretacion de mensaje");
            }
            $passwordSpan.textContent=body.password;
            await sleep(3000);
            $passwordSpan.textContent="";
            $passwordSpan.style.display = 'none';
        } else if (buttonText === 'change password') {
            console.log("cambiando contraseña del dispositivo");
            openPasswordModal('changePassword');
        }
        else if(buttonText == "restart"){
            console.log("Restableciendo dispositivo");
            const issue="Restart";
            const response=await sendWebSocketMessage({
                issue:"send a message to a specific client",
                ws_id:device.wsId,
                body:{
                    issue:issue
                }
            },true)
            const body=response.body
            if(body.issue!=issue && body.state!="OK"){
                throw new Error("Error en la interpretacion de mensaje");
            }
        }
    } catch (err) {
        console.error("Error mandando mensaje: ", err)
        createToast("error","Websocket: ","An error occurred while communicating with your device, please try again.");
    }
}

// Modal de tarjetas
function initializeCardModal() {
    const $cardsModal = d.getElementById('cards-modal');
    const $closeModalBtn = d.querySelector('.close-modal-cards');
    const $saveChangesBtn = d.getElementById('btn-save-change-cards');
    const $addCardBtn = d.querySelector('.add-card');
    const $changeCardsForm = d.getElementById('change-cards-form');

    if ($closeModalBtn) {
        $closeModalBtn.addEventListener('click', closeCardModal);
    }

    if ($saveChangesBtn) {
        $saveChangesBtn.addEventListener('click', saveCardChanges);
    }

    if ($addCardBtn) {
        $addCardBtn.addEventListener('click', addNewCard);
    }

    window.addEventListener('click', closeModalOnOutsideClick);

    updateCardListeners();
}

function openCardModal() {
    d.getElementById('cards-modal').style.display = 'block';
    updateCardListeners();
}

function closeCardModal() {
    d.getElementById('cards-modal').style.display = 'none';
}

function saveCardChanges() {
    const $cardInputs = d.querySelectorAll('#change-cards-form .card-info input');
    $cardInputs.forEach($input => {
        saveInputChanges($input);
    });
    console.log('Cambios guardados');
    closeCardModal();
}

function addNewCard() {
    const $changeCardsForm = d.getElementById('change-cards-form');
    if ($changeCardsForm) {
        const newCardHTML = createNewCardHTML(cardCounter);
        $changeCardsForm.insertAdjacentHTML('afterbegin', newCardHTML);
        cardCounter++;
        updateCardListeners();
    }
}

let cardCounter = 0;

function createNewCardHTML(cardNumber) {
    return `
    <div class="card-info">
        <button type="button" aria-label="New card">
            <i class="fa-solid fa-address-card"></i>
        </button>
        <label for="nameCard-${cardNumber}">Name:</label>
        <input id="nameCard-${cardNumber}" type="text" placeholder="Card Name" disabled>
        <i class="fas fa-pencil-alt edit-icon-card"></i>
        <i class="fas fa-trash-alt"></i>
    </div>
    `;
}

function closeModalOnOutsideClick(e) {
    if (e.target === d.getElementById('cards-modal')) {
        closeCardModal();
    } else if (e.target === d.querySelector('.modal-password-user-devices')) {
        d.querySelector('.modal-password-user-devices').style.display = 'none';
    } else if (e.target === d.getElementById('modal-change-password-device')) {
        closeChangePasswordModal();
    }
}

function updateCardListeners() {
    const $editIcons = d.querySelectorAll('.edit-icon-card, .fa-pencil-alt');
    const $deleteIcons = d.querySelectorAll('.fa-trash-alt');

    $editIcons.forEach($icon => {
        $icon.removeEventListener('click', handleEditClick);
        $icon.addEventListener('click', handleEditClick);
    });

    $deleteIcons.forEach($icon => {
        $icon.removeEventListener('click', handleDeleteClick);
        $icon.addEventListener('click', handleDeleteClick);
    });

    updateSaveChangesButtonVisibility();
}

function updateSaveChangesButtonVisibility() {
    const $changeCardsForm = d.getElementById('change-cards-form');
    const $saveChangesBtn = d.getElementById('btn-save-change-cards');
    const hasCards = $changeCardsForm.querySelector('.card-info') !== null;
    $saveChangesBtn.style.display = hasCards ? 'block' : 'none';
}

// Modal Change Password
// Modal de contraseña
function initializePasswordModal() {
    const $openChangePasswordModal = d.getElementById('open-change-password-modal');
    const $modalChangePassword = d.getElementById('modal-change-password-device');
    const $modalContent = d.querySelector('.modal-change-password-content');
    const $closeModalPasswordBtn = d.querySelector('.close-modal-password-device');
    const $savePasswordBtn = d.getElementById('btn-save-password-device');
    const $passwordModal = d.querySelector('.modal-password-user-devices');

    if ($openChangePasswordModal && $modalChangePassword) {
        //$openChangePasswordModal.addEventListener('click', () => openPasswordModal('changePassword'));
    }

    if ($closeModalPasswordBtn) {
        $closeModalPasswordBtn.addEventListener('click', () => {
            closeChangePasswordModal();
            clearPasswordInput();
        });
    }

    if ($savePasswordBtn) {
        $savePasswordBtn.addEventListener('click', saveNewPassword);
    }

    if ($passwordModal) {
        $passwordModal.querySelector('form').addEventListener('submit', verifyPassword);
    }

    window.addEventListener('click', (e) => {
        closeChangePasswordModalOnOutsideClick(e);
        if (e.target === $passwordModal) {
            closePasswordModal();
            clearPasswordInput();
        }
    });

    if ($modalContent) {
        $modalContent.addEventListener('click', stopPropagation);
    }
}

function openPasswordModal(action) {
    const $passwordModal = d.querySelector('.modal-password-user-devices');
    $passwordModal.style.display = 'block';
    $passwordModal.dataset.action = action;
}

function closePasswordModal() {
    const $passwordModal = d.querySelector('.modal-password-user-devices');
    $passwordModal.style.display = 'none';
}

function clearPasswordInput() {
    const $passwordInput = d.getElementById('modal-password-user-devices');
    if ($passwordInput) {
        $passwordInput.value = '';
    }
}

async function verifyPassword(e) {
    e.preventDefault();
    const password = d.getElementById('modal-password-user-devices').value;
    const action = e.target.closest('.modal-password-user-devices').dataset.action;
    // Simulando que la contraseña correcta es "1234"

    fetchRequest({
        method:"POST",
        url:`http://${location.hostname}:80/password`,
        contentType:"application/json",
        data:JSON.stringify({password:password}),
        async success(response){
            if(response.ok){
                closePasswordModal();
                clearPasswordInput();
                if (action === 'changePassword') {
                    openChangePasswordModal();
                } else if (action === 'cards') {
                    openCardModal();
                }
            }
            else{
                closePasswordModal();
                clearPasswordInput();
                createToast("error","Error: ","Password incorrect"); 
            }
        },
        async error(err){
            console.error(`Ocurrio un error en la peticion http://${location.hostname}:80/password`);
            closePasswordModal();
            clearPasswordInput();
            createToast("error","Error: ","Server error");
        }
    })

    /*
    if (password === "1234") {
        closePasswordModal();
        clearPasswordInput();
        if (action === 'changePassword') {
            openChangePasswordModal();
        } else if (action === 'cards') {
            openCardModal();
        }
    } else {
        alert("Contraseña incorrecta");
    }
    */
}

function openChangePasswordModal() {
    d.getElementById('modal-change-password-device').style.display = 'block';
}

function closeChangePasswordModal() {
    d.getElementById('modal-change-password-device').style.display = 'none';
}

async function saveNewPassword() {
    console.log('Intentando guardar password');
    const issue="Set password";
    const password=d.querySelector("#new-password-device").value;
    console.log(password);
    try {
        const response=await sendWebSocketMessage({
            issue:"send a message to a specific client",
            ws_id:device.wsId,
            body:{
                issue:issue,
                password:password
            }
        },true)
        const body=response.body
        if(body.issue!=issue && body.state!="OK"){
            throw new Error("Error en la interpretacion de mensaje");
        }
        console.log('Contraseña guardada');
        createToast("success",`${device.name}: `,"Password saved");
    } catch (err) {
        console.error('Contraseña no guardada',err);
        createToast("error","Websocket: ",`An error occurred while communicating "${device.name}" device, please try again.`);
    }
    closeChangePasswordModal();
}

function closeChangePasswordModalOnOutsideClick(e) {
    if (e.target === d.getElementById('modal-change-password-device')) {
        closeChangePasswordModal();
        clearPasswordInput();
    }
}

function stopPropagation(e) {
    e.stopPropagation();
}
//variables que usare para almacenar al objeto bluetooth
let ssem, ssemLA;

// Sección de Add Device
function initializeAddDeviceForm() {
    const $addCardBtn = d.getElementById('add-card-btn');
    const $cardList = d.getElementById('card-list');
    const $addDeviceForm = d.querySelector('.add-device-form');
    const $bluetoothBtn=d.querySelectorAll(".device-name");
    const $devicePasswordInput = d.getElementById('devicePassword');

    if ($devicePasswordInput) {
        $devicePasswordInput.addEventListener('input', function(e) {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
    }

    if ($addCardBtn && $cardList) {
        $addCardBtn.addEventListener('click', addNewCardItem);
    }

    if ($addDeviceForm) {
        $addDeviceForm.addEventListener('submit', handleAddDeviceSubmit);
    }
    $bluetoothBtn.forEach($btn => {
        $btn.addEventListener("click",connectBluetooth);
    });
}
//funcion para conectar un dispositivo bluetooth
async function connectBluetooth(e) {
    console.log("Iniciando conexion con dispositio bluetooth",e.target);
    const $btn = e.target.closest(".device-name");
    const state = $btn.getAttribute("data-state");
    const device = $btn.getAttribute("data-type-device");

    console.log(state,device);
    if (state === "disconnected") {
      console.log("Conectando dispositivo Bluetooth...");
      let connected = false;
      try {
        if (device === "SSEM") {
            if(!ssem) ssem = new Bluetooth(device);
            connected = await ssem.connect();
        } else if (device === "SSEM_LA") {
          if(!ssemLA)ssemLA = new Bluetooth(device);
          connected = await ssemLA.connect();
        }
        await sleep(500);
        removeLoadingScreen();
        if (connected) {
          console.log("Conexión exitosa");
          $btn.setAttribute("data-state", "connected");
        }
      } catch (error) {
        console.error("Error de conexión:", error);
        removeLoadingScreen();
      }
    } else if (state === "connected") {
      console.log("Desconectando dispositivo Bluetooth...");
      try {
        if (device === "SSEM") {
          await ssem.disconnect();
        } else if (device === "SSEM_LA") {
          await ssemLA.disconnect();
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

function addNewCardItem() {
    const $cardList = d.getElementById('card-list');
    const cardItem = createCardItemElement();
    $cardList.appendChild(cardItem);
}

function createCardItemElement() {
    const cardItem = d.createElement('div');
    cardItem.className = 'card-item';
    cardItem.innerHTML = `
        <button type="button">
            <i class="fa-solid fa-address-card"></i>
        </button>
        <input type="text" placeholder="Card Name">
        <button type="button" class="delete-card-devices">
            <i class="fas fa-trash-alt"></i>
        </button>
    `;

    const deleteBtn = cardItem.querySelector('.delete-card-devices');
    deleteBtn.addEventListener('click', () => cardItem.remove());

    return cardItem;
}

async function handleAddDeviceSubmit(e) {
    e.preventDefault();
    const $form = e.target;
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
    */
    //enviamos las credenciales al dispositivo SSEM
    console.log("Enviando credenciales al dispositivo SSEM");
    try {
      await ssem.sendMessage(ssemCredentials);
      const dataString = await ssem.waitForResponse();
      const data = JSON.parse(dataString);
      console.log("Informacion recibida de SSEM",data);
      if (data.issue != "Set credentials" && data.state != "OK") {
        throw new Error("A problem occurred while configuring the SSEM device");
      }
      /*
      console.log(ssemCredentials);
      const wasSent=await ssem.connect("Set credentials",ssemCredentials);
      if(!wasSent){
        throw new Error("A problem occurred while configuring the SSEM device");
      }
        */
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
    console.log("Haciendo peticion fetch para guardar los cambios");
    let savedCredentials = false;
    //Hago la peticion fech para ver si
    await fetchRequest({
      url: `http://${location.hostname}/devices`,
      method: "POST",
      data: JSON.stringify(webCredentials),
      contentType: "application/json",
      async success(response) {
        if (response.ok) {
            savedCredentials = true;
            const result = await response.json();
            console.log('respuesta del servidor',result);
            webCredentials.device = result.deviceNumber;
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
    await sleep(1000);
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