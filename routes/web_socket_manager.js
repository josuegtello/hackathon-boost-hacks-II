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
function addNotification(ws, notificacion){
  const client=clients.get(ws);
  const {user_id,type}=client;


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
  WebSocketServer: WebSocket.Server
};