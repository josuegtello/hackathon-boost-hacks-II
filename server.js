//en este archivo gestionare y hare todo lo que necesite el servidor
//Dependencias Especificas
const WebSocket=require("ws");
const websocketManager=require("./routes/web_socket_manager");
const os = require('os');
const fs=require("fs");
const multer = require('multer');
const path=require('path');
const http = require('http');
const express=require("express");
const session=require('express-session');
//importamos rutas
const signUp=require("./routes/sign_up");
const signIn=require("./routes/sign_in");
const signOut=require("./routes/sign_out");
const signInDevice=require("./routes/sign_in_devices");
const devices=require("./routes/devices");




//obtenemos la direccion IP de nuestro servidor para acceder a el desde cualquier dispositivo
function getLocalIpAddress() {
    const networkInterfaces = os.networkInterfaces();
    for (const interfaceName in networkInterfaces) {
      const networkInterface = networkInterfaces[interfaceName];
      for (const interfaceInfo of networkInterface) {
        if (interfaceInfo.family === 'IPv4' && !interfaceInfo.internal) {
          return interfaceInfo.address;
        }
      }
    }
    return null;
}  
const localIpAddress = getLocalIpAddress();
console.log('Dirección IP local:', localIpAddress);
//para el servicio de html estatico
const app=express();
//para el manejo de las conexiones al servidor por http
const httpServer=http.createServer(app); 
//Configuracion del middleware la sesion
const sessionParser=session({
  secret:uuidv4(),  //clave secreta para firmar la cooki de la sesion (debe ser segura y unica)
  resave:false,   //No vuelve a cargar la sesion si no ha sido modificada
  saveUninitialized:true, //Guarda la sesion nueva aunque no tenga datos
  cookie:{secure:false} //secure:true requiere HTTPS; 'false' permite HTTP
})
app.use(sessionParser);
/*
Cuando iniciamos una peticion web Socket, primero hace una peticion http para pedir
el cambio de comunicacion a websocket, eso se gestiona en la cabecera upgrade,
si se hace una comunicacion web socket checamos si existe la sesion, de lo contrario
cortamos el puente de comunicacion(las sesiones al ser una comunicacion http la tenemos
que setear para el websocket)
*/
httpServer.on('upgrade', (request, socket, head) => {
  //console.log('Upgrade request headers:', request.headers);
  sessionParser(request, {}, () => {
    //console.log('Session after parser:', request.session);
    if (!request.session || (!request.session.user && !request.session.device)) {
      console.log('Unauthorized WebSocket connection attempt');
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }
    console.log('Authorized WebSocket connection');
    webSocket.handleUpgrade(request, socket, head, (ws) => {
      webSocket.emit('connection', ws, request);
    });
  });

});
//WebSocket
const webSocket= new WebSocket.Server({noServer:true});   
//const clients=new Map();    //almacenare todos los cliente web socket que tenga en esta variable
function uuidv4() { //genero un ID unico para cada cliente wenSocket que tenga para poder identificarlos
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, 
            v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}
webSocket.on("connection",(ws,req)=>{
  //El webSocket es una caracterestica unica para clientes registrados
  //por lo que validaremos si ya iniciaron sesion
  const session=req.session || {};
  console.log(session);
  const user=session.user;
  const device=session.device;
  if(!user&&!device){ //si no existe significa que no ha iniciado sesion ni como usuario web ni como dispositivo
    console.log('Usuario WebSocket no autorizado, cerrando conexion');
    const callback={
      issue:"Unauthorized web socket client"
    }
    ws.send(JSON.stringify(callback));
    ws.close();//cerramos la conexion
    return;
  }
  
  //Si si existe 
  const ws_id=uuidv4(),  //genero el ID webSocket
        color=Math.floor(Math.random()* 360);   //genero un color aleatorio
  const metadata={ws_id,color};    //creo un objeto con este metadata
  const callback={    //siempre que enviemos informacion se la mandaremos en forma de texto, este es un objeto
    issue:'Web Socket connected',  //le informamos que su conexion a sido exitosa y le mandamos el ID que se le asigno
    ws_id:ws_id,
  }
  //Definimos metadata especifica dependiendo del usuario
  if(user){
    metadata.user_id=user.id;
    metadata.type=user.type;
  }
  else if(device){
    metadata.device_id=device.id;
    metadata.type=device.type;
  }
  websocketManager.addClient(ws,metadata);
  //clients.set(ws,metadata);   //en la variable clients almaceno al nuevo cliente y aparte su metadata de identificacion
  //console.log(clients)
  
  ws.send(JSON.stringify(callback)); //su primer conexion, le mandamos el id que le asigno node

  ws.on('error',(err)=>{ //si tenemos un error en conexion con alguno de los clientes el servidor nos informara el error
    console.error(err);

  })
  ws.on('close',()=>{ //si el cliente webSocket se ha desconectado
      console.log('disconnected');
      console.log(websocketManager.getClient(ws)); //obtenemos al cliente que se desconecto
      websocketManager.removeClient(ws);
      //clients.delete(ws); //eliminamos al cliente de la lista
  });
  ws.on('message',(message)=>{    //cuando el cliente manda algun mensaje al servidor
    try {
      const data=JSON.parse(message);
      //const metadata=clients.get(ws);
      const metadata=websocketManager.getClient(ws);
      console.log("Mensaje recibido");
      console.log(data);
      console.log("metadata del cliente");
      console.log(metadata);

    } 
    catch (err) {
      console.log('Error en el formato de datos');
      console.error(err);
    }
    //const outbound = JSON.stringify(data);
    /* POR SI SE LO NECESITO MANDAR A todos los clientes
    [...clients.keys()].forEach((client) => {
      client.send(outbound);
    });
      */
    
  });
});
//si intentamos una conexion webSocket por el puerto 80 la destruimos





//HTTP
//Ruta donde servira todo el html estatico
app.use(express.static(path.join(__dirname + '/public')));
// Middleware para parsear los datos que recibamos
app.use(express.urlencoded({ extended: true })); // Para datos de formularios URL-encoded
app.use(express.json()); // Para datos en formato JSON
//Rutas
app.use("/sign-up",signUp);
app.use("/sign-in",signIn);
app.use("/sign-out",signOut);
app.use("/sign-in-device",signInDevice);
app.use("/devices",devices);

//cuando la ruta no pertenezca a una definida lanzaremos un estado de respuesta 404
app.use((req,res)=>{  
    res.status(404);
    res.send("Resource Not Found");  
})
//todas nuestras peticiones http las haremos en el puerto 80
httpServer.listen(80,()=>{ 
  console.log("Listen HTTP port 80")
  console.log("Routes:");
  console.log("/sign-up Ruta para registrarte");
  console.log("/sign-in Ruta para iniciar sesion");
  console.log("/sign-out Ruta para cerrar sesion");
  console.log("/sign-in-device Ruta para inicio de sesion de dispositivos IoT");
});

