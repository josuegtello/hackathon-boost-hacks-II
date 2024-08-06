
import {createToast} from "./notification.js";
import {sleep} from "./sleep.js";

const d=document;
let connection = {
    readyState: WebSocket.CLOSED
}
const handleOnMessage=function(event) {
    const data=JSON.parse(event.data);
    console.log(data);
    if(data.issue=="new notification"){
        
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
    await sleep(5000);
    connectWebSocket();
    
}
const handleOnError=function(event) {
    console.log("WebSocket error: ", event);
    //createToast('error','WebSocket:','An error has occurred');
}

// Función que inicializa el WebSocket
export const connectWebSocket=async function(){
    // no se hace nada si se esta conectado o ya esta conectado
    if(connection.readyState === WebSocket.CONNECTING || connection.readyState === WebSocket.OPEN) return;
    connection=new WebSocket(`ws://${location.hostname}:80`);
    connection.debug = true;
    connection.addEventListener("message", handleOnMessage);
    connection.addEventListener("open", handleOnOpen);
    connection.addEventListener('close', handleOnClose);  
    connection.addEventListener("error", handleOnError);
}
export const sendWebSocketMessage=function(data){
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