// websocketManager.js
const WebSocket = require('ws');

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
function getDevices(filterCriteria) {   //funcion que nos permitira obtener dispositivos a base de un criterio
    const filter = {};
    console.log('Metadata de los dispositivos contectados');
    for (const [client, metadata] of clients.entries()) {
        console.log(metadata);
        if (filterCriteria(metadata)) {
            console.log("dispositivo conectado encontrado");
            filter.ws_id=metadata.id;
            filter.type=metadata.type
            console.log(filter)
        }
    }     
    //console.log('Del filtro se obtuvo la sig, informacion');
    //console.log(filter);
    return (filter.length==1)?filter[1]:filter;
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