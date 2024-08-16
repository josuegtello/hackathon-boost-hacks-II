// websocketManager.js
const WebSocket = require('ws');
const fs = require("fs");

const clients = new Map();

function addClient(ws, metadata) {
  clients.set(ws, metadata);
}
function getClient(ws){
    return clients.get(ws);
}
function removeClient(ws) {
  clients.delete(ws);
}

function getClientIds(filter = () => true) {
  return Array.from(clients.values())
    .filter(filter)
    .map(metadata => metadata.id);
}
function addNotification(ws, data){
  console.log("Agregando notificacion a usuario");
  const client=clients.get(ws);
  const {user_id,device,device_id,type}=client;
  const {body,date}=data;
  const notification={
            device:device,
            body:body,
            date:date,
            name:"",
            type:type
        }
      //leemos el archivo de nuestra base de datos
      fs.readFile("./data_base/users.json", "utf-8", (err, jsonString) => {
        //funcion no bloqueante para leer
        if (err) {
          //lanzar estado de error
          console.log(err);
          console.log("Error actualizando buzon de notificaciones");
        } else {
          //aqui ponemos todo lo que queramos
          try {
            const data = JSON.parse(jsonString); //convertimos el archivo en formato JSON para manipularlo
            data.forEach((user) => {
              if(user.id==user_id){ //es el usuario agregamos la notificacion
                user.devices.forEach(dvc => {
                  if(dvc.id==device_id){
                    notification.name=dvc.name;
                  }
                });
                if(!user.notifications)user.notifications=[];
                console.log("Notificacion que se va a guardar",notification);
                user.notifications.push(notification);
              }
            });
            fs.writeFile("./data_base/users.json",JSON.stringify(data, null, 2),(err) => {
                if (err) {
                  console.log(err);
                  console.log("Error agregando notificacion en el buzon");
                } else {
                  console.log("Usuario encontrado y actualizado buzon de notificaciones");
                }
              }
            );

          } catch (err) {
            console.log("Error parsing JSON", err);
            console.log("Error agregando notificacion en el buzon");
          }
        }
      });
}
function getDevices(filterCriteria) {   //funcion que nos permitira obtener dispositivos a base de un criterio
    const filter = [];
    console.log('Metadata de los dispositivos contectados');
    for (const [client, metadata] of clients.entries()) {
        console.log(metadata);
        if (filterCriteria(metadata)) {
            console.log("dispositivo conectado encontrado");
            const {ws_id,type,device}=metadata
            filter.push({
              ws_id:ws_id,
              type:type,
              device:device
            })
        }
    }     
    //console.log('Del filtro se obtuvo la sig, informacion');
    console.log(filter);
    return (filter.length>0)?filter:null;
}
//funcion que me permite enviar a clientes especificos
function sendToSpecificClient(message, filter) {
    for (const [client, metadata] of clients.entries()) {
        if (filter(metadata)) {
            client.send(JSON.stringify(message));
        }
    }
}
module.exports = {
  addClient,
  getClient,
  removeClient,
  getClientIds,
  getDevices,
  sendToSpecificClient,
  addNotification,
  WebSocketServer: WebSocket.Server
};