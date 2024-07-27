//en este archivo gestionare y hare todo lo que necesite el servidor
//Dependencias Especificas
const WebSocket=require("ws");
const os = require('os');
const fs=require("fs");
const multer = require('multer');
const path=require('path');
const lookup = require("mime-types").lookup;
const express=require("express");
const { body, validationResult } = require('express-validator');
const session=require('express-session');
//importamos rutas
const signUp=require("./routes/sign_up");
const signIn=require("./routes/sign_in");
const signOut=require("./routes/sign_out");

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
console.log("http port:80");


//para el servicio de html estatico
const app=express();
//Configuracion del middleware la sesion
app.use(session({
  secret:uuidv4(),  //clave secreta para firmar la cooki de la sesion (debe ser segura y unica)
  resave:false,   //No vuelve a cargar la sesion si no ha sido modificada
  saveUninitialized:true, //Guarda la sesion nueva aunque no tenga datos
  cookie:{secure:false} //secure:true requiere HTTPS; 'false' permite HTTP
}));
//Ruta donde servira todo el html estatico
app.use(express.static(path.join(__dirname + '/public')));
// Middleware para parsear los datos que recibamos
app.use(express.urlencoded({ extended: true })); // Para datos de formularios URL-encoded
app.use(express.json()); // Para datos en formato JSON
//Rutas
app.use("/sign-up",signUp);
app.use("/sign-in",signIn);
app.use("/sign-out",signOut);

//cuando la ruta no pertenezca a una definida lanzaremos un estado de respuesta 404

app.use((req,res)=>{  
    res.status(404);
    res.send("Resource Not Found");  
})
//todas nuestras peticiones http las haremos en el puerto 80
app.listen(80,()=>{ 
    console.log("Listen HTTP port")
    console.log("Routes:");
    console.log("/sign-up Ruta para registrarte")
    console.log("/sign-in Ruta para iniciar sesion");
    console.log("/sign-out Ruta para cerrar sesion")
})


//WebSocket

console.log("ws port:81");
const serverWS= new WebSocket.Server({port:81});    //especifico en que puerto va a estar escuchando 
const clients=new Map();    //almacenare todos los cliente web socket que tenga en esta variable
const master=new Map();
function uuidv4() { //genero un ID unico para cada cliente wenSocket que tenga para poder identificarlos
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}
serverWS.on("connection",(ws,req)=>{
  const id=uuidv4(),  //genero el ID
        color=Math.floor(Math.random()* 360),   //genero un color aleatorio
        metadata={id,color};    //creo un objeto con este metadata
  clients.set(ws,metadata);   //en la variable clients almaceno al nuevo cliente y aparte su metadata de identificacion
  //debug(clients)
  const callback={    //siempre que enviemos informacion se la mandaremos en forma de texto, este es un objeto
      issue:'CONNECTION_SUCCESFULL',  //le informamos que su conexion a sido exitosa y le mandamos el ID que se le asigno
      id:id,
  }
  ws.send(JSON.stringify(callback)); //su primer conexion, le mandamos el id que le asigno node

  ws.on('error',()=>{ //si tenemos un error en conexion con alguno de los clientes el servidor nos informara el error
    console.error();
  })
  ws.on('close',()=>{ //si el cliente webSocket se ha desconectado
      debug('disconnected');
      //debug(master.get(ws));
      //const metadataM=master.get(ws);
      //const metadata=clients.get(ws);
      //debug(metadataM);
      //debug(master);

      clients.delete(ws); //eliminamos al cliente de la lista
  });
  ws.on('message',(message)=>{    //cuando el cliente manga algun mensaje al servidor
    const data=JSON.parse(message);
    const metadata=clients.get(ws);
    debug("Mensaje recibido")
    debug(data);
    debug("metadata del cliente")
    debug(metadata);
    //message.sender = metadata.id;
    //message.color = metadata.color;
    //debug(data);
    /*
      Estructura basica de los mensaje
      data{
        issue:'Motivo del mensaje'
        message:'mensaje'
      }
    */
    //const outbound = JSON.stringify(data);
    /* POR SI SE LO NECESITO MANDAR A todos los clientes
    [...clients.keys()].forEach((client) => {
      client.send(outbound);
    });
      */
  });
});