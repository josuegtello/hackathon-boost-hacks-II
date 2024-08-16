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
const password=require("./routes/password");
const notifications=require("./routes/notifications");

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
    if (!request.session || (!request.session.user && !request.session.device)) {
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
const PING_INTERVAL = 30000; // Intervalo para enviar PINGs (30 segundos)
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
    metadata.user_id = device.user_id;
    metadata.device_id = device.id;
    metadata.type = device.type;
    metadata.device = device.device;
    //mandamos el mensaje que se ha conectado un dispositivo IoT
    const {user_id,ws_id}=metadata,
          clientMessage={
            issue:"IoT device connected",
            ws_id:ws_id,
            device:device.device,
          }
    websocketManager.sendToSpecificClient(
      clientMessage,
      (metadata) => metadata.user_id == user_id && !metadata.device_id);
  }
  console.log("Nuevo cliente conectado");
  console.log(metadata);
  websocketManager.addClient(ws, metadata);
  if(metadata.device_id){ //es un dispositivo creo la notificacion
    const date=Date.now().toString();
    const notificacion={
      body:{
        message:"Device connected"
      },
      date:date
    }
    websocketManager.addNotification(ws,notificacion)
  }
  const callback = {
    //siempre que enviemos informacion se la mandaremos en forma de texto, este es un objeto
    issue: "Web Socket connected", //le informamos que su conexion a sido exitosa y le mandamos el ID que se le asigno
    ws_id: ws_id,
  };
  ws.send(JSON.stringify(callback)); //su primer conexion, le mandamos el id que le asignamos
  //Manejadores de los eventos ping y pong
  let pongReceived = true;
  // Función para enviar PING
  const sendPing = () => {
    if (!pongReceived) {
      const client=websocketManager.getClient(ws);
      console.log(`No se recibió PONG de ${client.type}, cerrando conexión`);
      ws.terminate(); // Terminar conexión si no se recibió PONG
      return;
    }
    pongReceived = false;
    ws.ping(); // Enviar PING
  };
  const pingInterval = setInterval(sendPing, PING_INTERVAL);

  ws.on("pong", () => {
    const client=websocketManager.getClient(ws);
    console.log(`PONG recibido de ${client.type}`);
    pongReceived = true; // Se recibió PONG
  });
  //En caso de error vemos que paso con el cliente web socket
  ws.on("error", (err) => {
    //si tenemos un error en conexion con alguno de los clientes el servidor nos informara el error
    console.error(err);
  });
  //en caso de que se cierre conexion con el cliente WebSocket
  ws.on("close", () => {
    clearInterval(pingInterval); // Limpiar intervalo de PING al cerrar conexión
    //si el cliente webSocket se ha desconectado
    console.log("client disconnected");
    const client = websocketManager.getClient(ws);
    console.log(client); //obtenemos al cliente que se desconecto
    //mandamos mensaje a todos los dispositivos asociados que se ha desconectado
    if (client.device_id) {
      //era un dispositivo IoT, envio mensaje a todos los usuarios web que se ha desconectado
      const { ws_id, user_id,device } = client,
        clientMessage = {
          issue: "IoT device disconnected",
          ws_id: ws_id,
          device:device
        };
      const date=Date.now().toString();
      const notificacion={
        body:{
          message:"Device disconnected"
        },
        date:date
      }
      websocketManager.addNotification(ws,notificacion);
      console.log(`IoT device disconnected`);
      websocketManager.sendToSpecificClient(
        clientMessage,
        (metadata) => metadata.user_id == user_id && !metadata.device_id
      );
    }
    websocketManager.removeClient(ws); //removemos el elemento
  });
  //En caso de que el cliente mande un mensaje por WebSocket
  ws.on("message",(message) => {
    //cuando el cliente manda algun mensaje al servidor
    try {
      const data = JSON.parse(message);
      const client = websocketManager.getClient(ws);
      console.log("Mensaje webSocket recibido");
      console.log(data);
      console.log("del cliente");
      console.log(client);
      const { issue } = data;
      //Solo hay dos tipos de mensaje, mensajes del usuario web y de un dispositivo IoT(mensaje y notificaciones)
      if (issue == "send a message to a specific client") { //de un usuario web
        const { ws_id, body,correlationId } = data,
          clientMessage = {
            issue: "client message",
            body: body,
            correlationId:correlationId
          };
        if (ws_id != "" && body) {
          websocketManager.sendToSpecificClient(
            clientMessage,
            (metadata) => metadata.ws_id == ws_id
          );
        } 
        else {
          const callback = {
            issue: "invalid data format",
          };
          ws.send(JSON.stringify(callback));
        }
      } 
      else if (issue == "IoT device sending specific message") {  //mensaje de un dispositivo IoT
        const { user_id,ws_id,device } = client;
        const { body,correlationId} = data,
        clientMessage = {
          issue: "IoT device message",
          ws_id:ws_id,
          device:device,
          body: body,
          correlationId:correlationId //si es que existe la mandamos
        };
        if (body) {
          console.log("Mandando mensaje a clientes web de dispositivo IoT");
          websocketManager.sendToSpecificClient(
            clientMessage,
            (metadata) => metadata.user_id == user_id && !metadata.device_id
          );
        } 
        else {
          console.log("La estructura del mensaje es invalida");
          const callback = {
            issue: "invalid data format",
          };
          ws.send(JSON.stringify(callback));
        }
      }
      else if (issue == "IoT device sending notification") {  //notificacion de un dispositivo IoT
        //(FALTA) actualizar en nuestra base de datos esa notificacion con un metodo de websocketManager
        const { user_id,ws_id,device,type} = client;
        const { body } = data,
        date=Date.now().toString(),
        clientMessage = {
          issue: "IoT device notification",
          ws_id:ws_id,
          device:device,
          body: body,
          date:date,
          type:type
        };
        console.log("Fecha:",date);
        const notificationData={
          body:body,
          date:date
        }
        if (body) {
          console.log("Mandando notificacion a clientes web de dispositivo IoT");
          websocketManager.addNotification(ws,notificationData);
          websocketManager.sendToSpecificClient(
            clientMessage,
            (metadata) => metadata.user_id == user_id && !metadata.device_id
          );
        } 
        else {
          console.log("La estructura de la notificacion es invalida");
          const callback = {
            issue: "invalid data format",
          };
          ws.send(JSON.stringify(callback));
        }
      }
      else{
        const callback = {
          issue: "invalid data format",
        };
        ws.send(JSON.stringify(callback));
      }
    } 
    catch (err) {
      console.log("Error en el formato de datos");
      console.error(err);
      const callback = {
        issue: "invalid data format",
      };
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
// Definir la ruta que captura todas las rutas expecificas y las regreso al index.html
const routes = ['/home', '/sign-up', '/sign-in','/my-devices',"/my-profile"];
app.get(routes, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
//Rutas http que tenemos en el sitio
app.use("/sign-up", signUp);
app.use("/sign-in", signIn);
app.use("/sign-out", signOut);
app.use("/sign-in-device", signInDevice);
app.use("/devices", devices);
app.use("/profile", profile);
app.use("/password", password);
app.use("/notifications",notifications);

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
  console.log("/devices Ruta para obtener los dispositivos asociados a tu cuenta, actualizar con uno nuevo");
  console.log("/devices/connected Ruta que me devuelve los dispositivos conectados asociados a mi cuenta");
  console.log("/profile Ruta que me permite leer, actualizar y eliminar perfil");
  console.log("/profile/password Ruta que me permite cambiar la contraseña");
  console.log("/password Ruta que me permite verificar mi contraseña"); 
  console.log("/notifications Ruta que me permite obtener las notificaciones");
});
function uuidv4() {
  //genero un ID unico para cada cliente wenSocket que tenga para poder identificarlos
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
