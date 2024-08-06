//en este archivo gestionare y hare todo lo que necesite el servidor
//Dependencias Especificas
const WebSocket = require("ws");
const websocketManager = require("./routes/web_socket_manager");
const os = require("os");
const path = require("path");
const http = require("http");
const express = require("express");
const session = require("express-session");
//importamos rutas
const signUp = require("./routes/sign_up");
const signIn = require("./routes/sign_in");
const signOut = require("./routes/sign_out");
const signInDevice = require("./routes/sign_in_devices");
const devices = require("./routes/devices");
const profile = require("./routes/profile");

//obtenemos la direccion IP de nuestro servidor para acceder a el desde cualquier dispositivo
function getLocalIpAddress() {
  const networkInterfaces = os.networkInterfaces();
  for (const interfaceName in networkInterfaces) {
    const networkInterface = networkInterfaces[interfaceName];
    for (const interfaceInfo of networkInterface) {
      if (interfaceInfo.family === "IPv4" && !interfaceInfo.internal) {
        return interfaceInfo.address;
      }
    }
  }
  return null;
}
const localIpAddress = getLocalIpAddress();
console.log("Dirección IP local:", localIpAddress);
//para el servicio de html estatico
const app = express();
//para el manejo de las conexiones al servidor por http
const httpServer = http.createServer(app);
//Configuracion del middleware la sesion
const sessionParser = session({
  secret: uuidv4(), //clave secreta para firmar la cookie de la sesion (debe ser segura y unica)
  resave: false, //No vuelve a cargar la sesion si no ha sido modificada
  saveUninitialized: true, //Guarda la sesion nueva aunque no tenga datos
  cookie: {
    secure: false, //secure:true requiere HTTPS; 'false' permite HTTP
    httpOnly: true,
    sameSite: "strict",
  },
});
app.use(sessionParser);
/*
Middleware
Cuando iniciamos una peticion web Socket, primero hace una peticion http para pedir
el cambio de comunicacion a websocket, eso se gestiona en la cabecera upgrade,
si se hace una comunicacion web socket checamos si existe la sesion, de lo contrario
cortamos el puente de comunicacion(las sesiones al ser una comunicacion http la tenemos
que setear para el websocket)
*/
httpServer.on("upgrade", (request, socket, head) => {
  //console.log('Upgrade request headers:', request.headers);
  console.log("Cookie recibida:", request.headers.cookie);
  sessionParser(request, {}, () => {
    //console.log("Session after parser:", request.session);
    if (
      !request.session ||
      (!request.session.user && !request.session.device)
    ) {
      console.log("Unauthorized WebSocket connection attempt");
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }
    console.log("Authorized WebSocket connection");
    webSocket.handleUpgrade(request, socket, head, (ws) => {
      webSocket.emit("connection", ws, request);
    });
  });
});

//WebSocket
const webSocket = new WebSocket.Server({ noServer: true }); //El web socket funcionara en el puerto 80 tambien
webSocket.on("connection", (ws, req) => {
  //El webSocket es una caracterestica unica para clientes registrados, por lo que unicamente clientes van a poder conectarse
  const session = req.session || {},
    user = session.user,
    device = session.device,
    ws_id = uuidv4(), //genero el ID webSocket
    color = Math.floor(Math.random() * 360), //genero un color aleatorio
    metadata = { ws_id, color }; //creo un objeto con este metadata
  
  //Definimos metadata especifica dependiendo del usuario
  if (user) {
    metadata.user_id = user.id;
    metadata.type = user.type;
  } else if (device) {
    metadata.device_id = device.id;
    metadata.type = device.type;
    metadata.device=device.device;
  }
  console.log("Nuevo cliente conectado");
  console.log(metadata);
  websocketManager.addClient(ws, metadata);
  const callback = {
    //siempre que enviemos informacion se la mandaremos en forma de texto, este es un objeto
    issue: "Web Socket connected", //le informamos que su conexion a sido exitosa y le mandamos el ID que se le asigno
    ws_id: ws_id,
  };
  ws.send(JSON.stringify(callback)); //su primer conexion, le mandamos el id que le asignamos
  //En caso de error vemos que paso con el cliente web socket
  ws.on("error", (err) => {
    //si tenemos un error en conexion con alguno de los clientes el servidor nos informara el error
    console.error(err);
  });
  //en caso de que se cierre conexion con el cliente WebSocket
  ws.on("close", () => {
    //si el cliente webSocket se ha desconectado
    console.log("disconnected");
    console.log(websocketManager.getClient(ws)); //obtenemos al cliente que se desconecto
    //FALTA GENERAR UNA FUNCION QUE AVISE a los clientes asociados que ese dispositivo se desconecto
    websocketManager.removeClient(ws);
  });
  //En caso de que el cliente mande un mensaje por WebSocket
  ws.on("message", (message) => {
    //cuando el cliente manda algun mensaje al servidor
    try {
      const data = JSON.parse(message);
      const metadata = websocketManager.getClient(ws);
      console.log("Cliente mandando mensaje");
      console.log(metadata);
      console.log("Mensaje recibido");
      console.log(data);
      const {issue}=data;
      if(issue=="send specific message to client"){
        const {ws_id,message}=data,
              clientMessage={
                issue:"client message",
                message:message
              }
        if(ws_id!=""&&message!=""){
          websocketManager.sendToSpecificClient(clientMessage,(metadata) => (metadata.ws_id == ws_id))
        }
        else{
          const callback={
            issue:"invalid data format"
          }
          ws.send(JSON.stringify(callback));
        }
        
      }
    } catch (err) {
      console.log("Error en el formato de datos");
      console.error(err);
      const callback={
        issue:"invalid data format"
      }
      ws.send(JSON.stringify(callback));
    }
    //const outbound = JSON.stringify(data);
    /* POR SI SE LO NECESITO MANDAR A todos los clientes
    [...clients.keys()].forEach((client) => {
      client.send(outbound);
    });
      */
  });
});
webSocket.on("error", (error) => {
  console.error("WebSocket error:", error);
});

//HTTP
//Ruta donde servira todo el html estatico
app.use(express.static(path.join(__dirname + "/public")));
//Rutas http que tenemos en el sitio
app.use("/sign-up", signUp);
app.use("/sign-in", signIn);
app.use("/sign-out", signOut);
app.use("/sign-in-device", signInDevice);
app.use("/devices", devices);
app.use("/profile", profile);
//cuando la ruta no pertenezca a una definida lanzaremos un estado de respuesta 404
app.use((req, res) => {
  res.status(404);
  res.send("Resource Not Found");
});
//todas nuestras peticiones http las haremos en el puerto 80
httpServer.listen(80, () => {
  console.log("Listen HTTP port 80");
  console.log("Routes:");
  console.log("/sign-up Ruta para registrarte");
  console.log("/sign-in Ruta para iniciar sesion");
  console.log("/sign-out Ruta para cerrar sesion");
  console.log("/sign-in-device Ruta para inicio de sesion de dispositivos IoT");
  console.log("/devices Ruta para obtener los dispositivos asociados a tu cuenta");
  console.log("/profile Ruta que me permite leer, actualizar y eliminar perfil");

});
function uuidv4() {
  //genero un ID unico para cada cliente wenSocket que tenga para poder identificarlos
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}