import {setUser,getUser,setLoadingScreen,removeLoadingScreen} from "../main.js";
import {Bluetooth} from "./bluetooth.js";
import {createToast} from "./notification.js";
import { sleep } from "./sleep.js";
import {uuidv4} from "./uuidv4.js";


const d = document;

export function initializeDevices() {
    initializeTabs();
    initializeDeviceSection();
    initializeDashboard();
    initializeCardModal();
    initializePasswordModal();
    initializeAddDeviceForm();
    //testConnection();
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
        const $element = event.target.closest('.device-n, .card-info');
        if ($element) {
            showCustomConfirmModal(() => {
                $element.remove();
                if ($element.classList.contains('card-info')) {
                    updateSaveChangesButtonVisibility();
                }
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

function handleDashboardButtonClick() {
    const $icon = this.querySelector('i');
    const buttonText = this.querySelector('h4').textContent.trim().toLowerCase();

    if (buttonText === 'alarm' || buttonText === 'gate lock') {
        this.classList.toggle('active');

        if (buttonText === 'gate lock') {
            $icon.classList.toggle('fa-lock');
            $icon.classList.toggle('fa-lock-open');
        }
    } else if (buttonText === 'password') {
        showPasswordTemporarily(this);
    } else if (buttonText === 'change password') {
        openPasswordModal('changePassword');
    }
}

function showPasswordTemporarily($button) {
    const $passwordSpan = $button.querySelector('.see-password-dashboard');
    $passwordSpan.style.display = 'block';
    setTimeout(() => {
        $passwordSpan.style.display = 'none';
    }, 3000);
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
        $openChangePasswordModal.addEventListener('click', () => openPasswordModal('changePassword'));
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

function verifyPassword(e) {
    e.preventDefault();
    const password = d.getElementById('modal-password-user-devices').value;
    const action = e.target.closest('.modal-password-user-devices').dataset.action;
    // Simulando que la contraseña correcta es "1234"
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
}

function openChangePasswordModal() {
    d.getElementById('modal-change-password-device').style.display = 'block';
}

function closeChangePasswordModal() {
    d.getElementById('modal-change-password-device').style.display = 'none';
}

function saveNewPassword() {
    console.log('Nueva contraseña guardada');
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
const ssem=new Bluetooth("SSEM"),
    ssemLa=new Bluetooth("SSEM_LA");

// Sección de Add Device
function initializeAddDeviceForm() {
    const $addCardBtn = d.getElementById('add-card-btn');
    const $cardList = d.getElementById('card-list');
    const $addDeviceForm = d.querySelector('.add-device-form');
    const $bluetoothBtn=d.querySelectorAll(".device-name");

    if ($addCardBtn && $cardList) {
        $addCardBtn.addEventListener('click', addNewCardItem);
    }

    if ($addDeviceForm) {
        $addDeviceForm.addEventListener('submit', handleAddDeviceSubmit);
    }
    $bluetoothBtn.forEach($btn => {
        $btn.addEventListener("click",connecteBluetooth);
    });
}
async function connecteBluetooth(e){
    const   $btn=e.target.closest("[data-type-device]"),
            state=$btn.getAttribute('data-state'),
            device=$btn.getAttribute("data-type-device");
    if(state=="disconnected"){  //estamos tratando de conectar a un dispositivo bluetooth
        console.log("Conectando dispositivo bluetooth");
        if(device=="SSEM"){
            const connected = await ssem.connect();
            await sleep(1000);
            if (connected) {
                console.log("Conexión exitosa y verificada");
                createToast("success","Bluetooth: ","Successful connection to bluetooth device");
                $btn.setAttribute("data-state","connected");
                ssem.disconnect();
            } else {
                console.log("No se pudo conectar o verificar el dispositivo");
                createToast("error","Bluetooth: ","Failed to connect to bluetooth device");
            }
        }
        else if(device=="SSEM_LA"){
            const connected = await ssemLa.connect();
            if (connected) {
                console.log("Conexión exitosa y verificada");
                createToast("success","Bluetooth: ","Successful connection to bluetooth device");
                $btn.setAttribute("data-state","connected");
            } else {
                console.log("No se pudo conectar o verificar el dispositivo");
                createToast("error","Bluetooth: ","Failed to connect to bluetooth device");
            }
        }
    }
    if(state=="connected"){ //queremos desconectar al dispositivo bluetooth
        console.log("Desconectando dispositivo bluetooth");
        if(device=="SSEM"){
            await ssem.disconnect();
            $btn.setAttribute("data-state","disconnected");
        }
        else if(device=="SSEM_LA"){
            await ssemLa.disconnect();
            $btn.setAttribute("data-state","disconnected");
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
    const $form=e.target;
    console.log($form);
    setLoadingScreen("Configuring device, please wait...");
    //FALTA hacer condiciones dependiendo del dispositivo que estoy conectando
    /*
    if(!ssem.txCharacteristic){   //por pruebas nada mas seria el de SSEM, FALTA poner que ssemLa tambien exista
        await sleep(750);
        removeLoadingScreen();
        createToast("error","Error: ","Both devices must be connected to bluetooth");
        return;
    }
        */

    const id=uuidv4();
    const user=getUser();
    console.log(user);
    const webCredentials={
        id:id,
        name:$form.device_name.value,
        device:user.devices.length,
        type:'SSEM'
    }
    console.log(webCredentials);
    const bthCredentials={
        issue:"Set credentials",
        body:{
            id:id,
            password:$form.device_password.value,
            ssid:$form.ssid_name.value,
            ssid_password:$form.ssid_password.value
        }
    }
    console.log(bthCredentials);
    //FALTA mandar las credentiales a la web y confirmar que se han guardado


    //FALTA intercambiar datos entre SSEM_LA y SSEM (Direccion MAC de SSEM_LA)

    //Mando las credentiales a SSEM y espero su respuesta
    
    try {
        console.log("Iniciando conexión con SSEM...");
        await ssem.disconnect(false);
        const connected = await ssem.connect();
        if (!connected) {
            throw new Error("Failed to connect to SSEM device");
        }
        
        console.log("Mandando datos bluetooth a SSEM esperando respuesta...");        
        await ssem.sendBluetoothMessage(bthCredentials);
        
        console.log("Esperando respuesta de SSEM...");
        const dataString = await ssem.waitForResponse();
        const data = JSON.parse(dataString);
        console.log("Data bluetooth de SSEM recibido", data);
        
        if (data.issue !== "Set credentials" || data.state !== "OK") {
            throw new Error("A problem occurred while configuring the SSEM device");
        }
    } catch (err) {
        console.error("Error during device configuration:", err);
        removeLoadingScreen();
        createToast("error", "Error: ", err.message || "An unexpected error occurred with SSEM device");
        return;
    } finally {
        console.log("Proceso de configuración de SSEM finalizado");
    }
    //FALTA mandar las credenciales a SSEM_LA y esperar respuesta



    //si todo esta bien confirmamos que se guardo el dispositivo
    const {name,type,device}=webCredentials
    const newDevice={
        name,
        type,
        device,
        img:"./assets/img/user.jpg",
        state:"offline"
    }
    user.devices.push(newDevice);//agregamos el dispositivo al objeto user
    setUser(user);//actualizamos el usuario para que todos tengan el usuario
    addNewDevice(newDevice);   //agregamos al html el dispositivo
    removeLoadingScreen();
    createToast("success","Device: ","Device added successfully");
    console.log('Device added');
}