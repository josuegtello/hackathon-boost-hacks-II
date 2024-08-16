
import {createToast,addNotificationToMenu} from "./notification.js";
import {sleep} from "./sleep.js";
import {getUser,setUser,isAuthenticated} from "../main.js";
import {setDevice,updateDashboard} from "./devices.js";
import {addNotification} from "./edit_profile.js";

const d=document;
let connection = {
    readyState: WebSocket.CLOSED
}

class EventEmitter {
    constructor() {
        this.events = {};
    }

    on(event, listener) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(listener);
    }

    emit(event, data) {
        if (this.events[event]) {
            this.events[event].forEach(listener => listener(data));
        }
    }
}
const wsEventEmitter = new EventEmitter();
// Para escuchar notificaciones o mensajes no solicitados
wsEventEmitter.on('notification', (data) => {
    const {body,device,type,date}=data;
    const notification={
        device,
        body,
        date,
        name:"",
        type
    }
    const user=getUser();
    user.devices.forEach(dvc => {
        if(dvc.device==device){
            notification.name=dvc.name;
        }
    });
    console.log("Notificacion Nueva:",notification);
    user.notifications.push(notification);
    setUser(user)
    // Verificacion del contenido en el que estamos
    if(d.querySelector(".notify-menu")){    //si ya esta el submenu en el document
        addNotificationToMenu(notification);
    }
    if(d.querySelector("main.edit-profile")){   //si estamos en editar perfil
        addNotification(notification);
    }
    


});

wsEventEmitter.on('message', (data) => {
    console.log("Mensaje IoT recibido:", data);
    // Manejar el mensaje aquí
});

const handleOnMessage=function(event) {
    const data=JSON.parse(event.data);
    console.log("Mensaje Web Socket recibido");
    console.log(data);
    const {issue}=data;
    if (data.correlationId && pendingResponses.has(data.correlationId)) {   //estamos esperando una respuesta 
        const { resolve, reject, expectedDeviceId } = pendingResponses.get(data.correlationId);
        pendingResponses.delete(data.correlationId);

        if (data.ws_id === expectedDeviceId) {
            resolve(data);
        } else {
            reject(new Error(`Received response from unexpected device. Expected ${expectedDeviceId}, got ${data.ws_id}`));
        }
        return;
    } 
    //Los demas eventos normales los manejamos aqui
    if(issue == "Web Socket connected"){    //es el primer mensaje que te envia el servidor por medio de web socket, nos manda el id web socket que nos asigno
        console.log("configurando el puerto web socket");
        const {ws_id}=data;
        const user=getUser();
        user.setIdWebSocket(ws_id);
        setUser(user);
    }
    else if(issue == "IoT device connected"){ //se reconecto un dispositivo
        const {ws_id,device}=data;
        const user=getUser();
        console.log("Dispositivo IoT reconectado");
        console.log(ws_id,device);
        user.devices.forEach(dvc => {
            if(dvc.device==device){ //si coincide es el dispositivo que se conecto
                dvc.wsId=ws_id;
                dvc.state="online";
                const $dashboard=d.querySelector("#dashboard");
                if($dashboard){
                    const deviceDashboard=Number($dashboard.getAttribute("data-device-dashboard"));
                    if(deviceDashboard==dvc.device){
                        updateDashboard(dvc);
                    }
                }
                setDevice(dvc);
                createToast("info","Devices:",`Your device '${dvc.name}' is reconnected`);
            }
        });
        setUser(user);
    }
    else if(issue == "IoT device disconnected"){
        const {ws_id,device}=data;
        const user=getUser();
        console.log("Dispositivo IoT desconectado");
        console.log(ws_id,device);
        user.devices.forEach(dvc => {
            if((dvc.device==device)&&(dvc.wsId==ws_id)){ //si coincide es el dispositivo que se conecto
                dvc.wsId="";
                dvc.state="offline";
                const $dashboard=d.querySelector("#dashboard");
                if($dashboard){
                    const deviceDashboard=Number($dashboard.getAttribute("data-device-dashboard"));
                    if(deviceDashboard==dvc.device){
                        updateDashboard(dvc);
                    }
                }
                setDevice(dvc);
                createToast("info","Devices:",`Your device '${dvc.name}' is disconnected`);
            }
        });
        setUser(user);
        
        //FALTA poner la funcion que actualice en el html el estado del dispositivo


    }
    else if(issue == "IoT device message"){ //mensaje de un dispositivo 
        // Podríamos emitir un evento para mensajes no reconocidos si es necesario
        wsEventEmitter.emit('message', data);
    }
    else if (issue == "IoT device notification") {  //notificacion de un dispositivo
        wsEventEmitter.emit('notification', data);
    }
    else if(issue == "invalid data format"){    //el Web Socket nos informa que como queremos mandr la data es invalida
        console.error("El mensaje que se trato de mandar no tiene el formato esperado");
    }
    else{
        console.log("Mensaje no reconocido:", data);
        // Podríamos emitir un evento para mensajes no reconocidos si es necesario
        wsEventEmitter.emit('unknownMessage', data);
    }
}
const handleOnOpen=function(event) {
    sendWebSocketMessage({issue:'Hola mundo'});
    createToast('success','WebSocket:','connected, you are Online');
}
const handleOnClose=async function(event) {
    console.log("disconnected");
    createToast('success','WebSocket:','disconnected, you are Offline');
    // Tratamos de conectar nuevamente el websocket
    await connectWebSocket();
    
}
const handleOnError=function(event) {
    console.log("WebSocket error: ", event);
    //createToast('error','WebSocket:','An error has occurred');
}

/*
EJEMPLO DE COMO MANDARIA UN MENSAJE ESPERNADO LA RESPUESTA DE ESE MISMO DISPOSITIVO
try {
    const deviceId = "DEVICE_123"; // El ID del dispositivo específico
    const response = await sendWebSocketMessage({
        issue: "send a message to a specific client",
        ws_id: deviceId,
        body: {
            message: "Hello, specific device!"
        }
    }, true);

    console.log(`Respuesta recibida del dispositivo ${deviceId}:`, response);
} catch (error) {
    console.error("Error al enviar mensaje:", error);
}


//Como mandar un mennsaje especifico a un dispositivo IoT especifico
{
    issue:"send a message to a specific client",
    ws_id:"EL ID DEL DISPOSITIVO QUE QUEREMOS MANDAR EL MENSAJE",
    body:{
        message:"",
        arreglo:[]
    }
    body:"message"

    const user=getUser();//obtenemos el objeto
    
    

    //obtener el dispositivo especifico

    const device=//dispositivo especifivo ;
    device.wsId;

    setUser(user);
    fetchRequest({
        data:JSON.stringify(user);
    })



}

*/


// Función que inicializa el WebSocket
export const connectWebSocket=async function(){
    //esperamos 5 segundos para tratar una reconexion
    await sleep(5000);
    // no se hace nada si se esta conectado o ya esta conectado
    if(connection.readyState === WebSocket.CONNECTING || connection.readyState === WebSocket.OPEN) return;
    connection=new WebSocket(`ws://${location.hostname}:80`);
    connection.debug = true;
    connection.addEventListener("message", handleOnMessage);
    connection.addEventListener("open", handleOnOpen);
    connection.addEventListener('close', handleOnClose);  
    connection.addEventListener("error", handleOnError);
    return true;
}

//Funcion para almacenar promesas pendientes, generamos una cola
const pendingResponses = new Map();

export const sendWebSocketMessage=function(data, expectResponse = false){
    return new Promise((resolve, reject) => {
        if (connection.readyState === WebSocket.OPEN) {
            console.log('Enviando data por medio del Web Socket');
            console.log(data);

            if (expectResponse) {
                const correlationId = Date.now().toString();
                data.correlationId = correlationId; //voy a mandar este dato tambien para que sepa que es el dispositivo
                pendingResponses.set(correlationId, { 
                    resolve, 
                    reject,
                    expectedDeviceId: data.ws_id // Guardamos el DEVICE_ID esperado
                });
                // Configurar un tiempo de espera
                setTimeout(() => {
                    if (pendingResponses.has(correlationId)) {
                        pendingResponses.delete(correlationId);
                        reject(new Error('Timeout waiting for response'));
                    }
                }, 5000); // segundos de tiempo de espera
            }
            connection.send(JSON.stringify(data));

            if (!expectResponse) {
                resolve();
            }
        } else if (connection.readyState === WebSocket.CLOSED) {
            console.log("Web Socket desconectado, no se puede enviar mensaje");
            createToast('error', 'WebSocket:', 'Offline, unable to send messages');
            reject(new Error('WebSocket is disconnected'));
        }
    });
}
    
    /*
    if(connection.readyState===1){
        console.log('Enviando data por medio del Web Socket');
        console.log(data);
        connection.send(JSON.stringify(data));
    }
    else if(connection.readyState===3){
        console.log("Web Socket desconectado, no se puede enviar mensaje");
        createToast('success','WebSocket:','Offline, unable to send messages');
    }
}
*/