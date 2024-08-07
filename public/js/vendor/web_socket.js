
import {createToast} from "./notification.js";
import {sleep} from "./sleep.js";
import {getUser,setUser,isAuthenticated} from "../main.js";
import {setDevice} from "./devices.js";
const d=document;
let connection = {
    readyState: WebSocket.CLOSED
}
const handleOnMessage=function(event) {
    const data=JSON.parse(event.data);
    console.log("Mensaje Web Socket recibido");
    console.log(data);
    const {issue}=data;
    if(issue=="Web Socket connected"){    //es el primer mensaje que te envia el servidor por medio de web socket, nos manda el id web socket que nos asigno
        console.log("configurando el puerto web socket");
        const {ws_id}=data;
        const user=getUser();
        user.setIdWebSocket(ws_id);
        setUser(user);
    }
    if(issue=="IoT device notification"){
        
    }
    else if(issue=="IoT device connected"){ //se reconecto un dispositivo
        const {ws_id,device}=data;
        const user=getUser();
        console.log("Dispositivo IoT reconectado");
        console.log(ws_id,device);
        user.devices.forEach(dvc => {
            if(dvc.device==device){ //si coincide es el dispositivo que se conecto
                dvc.wsId=ws_id;
                dvc.state="online";
                setDevice(dvc);
                createToast("info","Devices:",`Your device '${dvc.name}' is reconnected`);
            }
        });
        setUser(user);
    }
    else if(issue=="IoT device disconnected"){
        const {ws_id,device}=data;
        const user=getUser();
        console.log("Dispositivo IoT desconectado");
        console.log(ws_id,device);
        user.devices.forEach(dvc => {
            if((dvc.device==device)&&(dvc.wsId==ws_id)){ //si coincide es el dispositivo que se conecto
                dvc.wsId="";
                dvc.state="offline";
                setDevice(dvc);
                createToast("info","Devices:",`Your device '${dvc.name}' is disconnected`);
            }
        });
        setUser(user);
        
        //FALTA poner la funcion que actualice en el html el estado del dispositivo


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