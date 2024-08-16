const express = require("express");
const fs = require("fs");
const router = express.Router();
const websocketManager = require("./web_socket_manager");
const { getDevices } = websocketManager;
//RUTA para solo obtener los usuarios normales
router.use(express.json());
router.route("/")
.get((req, res) => {
  console.log("GET /devices");
  res.setHeader("Content-Type", "application/json");
  const answer = {
    response:"",
    devices:[]
  };
  //Verificamos si esta creada la sesion, si lo esta tiene acceso a esta informacion, si no no
  if (req.session.user) {
    const devices = req.session.user.devices;
    //vemos cual es el id
    devices.forEach((dvc) => {
      const {device,type,name}=dvc
      answer.devices.push({
        device:device,
        type:type,
        name:name
      })
    });
    answer.response = "Account devices";
    console.log(answer);
    res.status(200);
    res.send(JSON.stringify(answer));
  } else {
    answer.response = "Unauthorized information";
    res.status(401);
    res.send(JSON.stringify(answer));
  }
})
.post((req,res)=>{
  console.log("POST /devices");
  res.setHeader("Content-Type", "application/json");
  const answer = {
    response:"",
    deviceNumber:null
  };
  //Verificamos si esta creada la sesion, si lo esta tiene acceso a esta informacion, si no no
  if (req.session.user) {
    const idUser=req.session.user.id;
    let validation=false;
    fs.readFile("./data_base/users.json", "utf-8", (err, jsonString) => {
      //funcion no bloqueante para leer
      if (err) {
        //lanzar estado de error
        console.log(err);
        answer.response = "Error creating device, try again";
        res.status(500);
        res.send(JSON.stringify(answer));
      } else {
        try {
          const data = JSON.parse(jsonString); //convertimos el archivo en formato JSON para manipularlo
          //console.log(data);
          //console.log(req.body)
          const {id,type,name}=req.body
          //aqui podriamos hacer la validacion
          if (
            !id ||
            !type ||
            !name ||
            name == "" ||
            type == "" ||
            id == ""
          ) {
            //si algunos de los datos no existe o vienen vacios enviamos estado de error
            res.status(400);
            res.send(JSON.stringify({ response: "Invalid data format" }));
            return;
          }
          let position=-1;
          data.forEach((user,index) => {
            if(user.id==idUser){//es el id,
              const deviceN=user.devices.length
              position=index;
              user.devices.push({
                id,
                device:deviceN,
                type,
                name
              });//insertamos el dispositivo al usuario
              validation=true;
              answer.deviceNumber=deviceN;
            }
          });
          if (!validation) {
            //mandamos el estado de error, no se encontro al usuario para actualizar la informacion
            console.log("Usuario no encontrado");
            answer.response = "User not found, id session invalid";
            console.log(answer);
            res.status(400);
            res.send(JSON.stringify(answer));
          } else {
            req.session.user.devices=data[position].devices //actualizamos la sesion
            //vamos a escribir en nuestro archivo JSON para conservar los datos
            fs.writeFile("./data_base/users.json",JSON.stringify(data, null, 2),(err) => {
                //prime parametro ruta, segundo la data que vamos a escribir, y el tercero estado de error
                if (err) {
                  console.log(err);
                  answer.response = "Error creating device, try again";
                  res.status(500);
                  res.send(JSON.stringify(answer));
                } else {
                  console.log("Escritura en archivo exitosa");
                  answer.response = "Device created successfully";
                  console.log(answer);
                  res.status(201);
                  res.send(JSON.stringify(answer));
                }
              }
            );
          }
        } catch (err) {
          console.log("Error parsing JSON", err);
          answer.response = "Error creating device, try again";
          res.status(500);
          res.send(JSON.stringify(answer));
        }
      }
    });
  } else {
    answer.response = "Unauthorized action";
    res.status(401);
    res.send(JSON.stringify(answer));
  }
})
.delete((req,res)=>{
  console.log("DELETE /devices");
  res.setHeader("Content-Type", "application/json");
  const answer = {
    response:"",
  };
  //Verificamos si esta creada la sesion, si lo esta tiene acceso a esta informacion, si no no
  if (req.session.user) {
    const idUser=req.session.user.id;
    let validation=false;
    fs.readFile("./data_base/users.json", "utf-8", (err, jsonString) => {
      //funcion no bloqueante para leer
      if (err) {
        //lanzar estado de error
        console.log(err);
        answer.response = "Error deleting device, try again";
        res.status(500);
        res.send(JSON.stringify(answer));
      } else {
        try {
          const data = JSON.parse(jsonString); //convertimos el archivo en formato JSON para manipularlo
          //console.log(data);
          //console.log(req.body)
          const {pos}=req.body
          console.log("Data recibida:",pos);
          let positionUser=-1;
          let positionDev=-1;
          data.forEach((user,index) => {
            if(user.id==idUser){//es el usuario, ahora buscamos entre sus dispositivos
              user.devices.forEach((dvc,indexDev) => {
                if(dvc.device==pos){  //es la posicion de usuario que esperamos
                  positionUser=index;
                  positionDev=indexDev;
                  console.log("Posicion del dispositivo a eliminar",indexDev);
                  validation=true;
                }
              });
            }
          });
          if (!validation) {
            //mandamos el estado de error, no se encontro al usuario para actualizar la informacion
            console.log("Usuario no encontrado");
            answer.response = "User not found, id session invalid";
            console.log(answer);
            res.status(400);
            res.send(JSON.stringify(answer));
          } else {
            const devices=data[positionUser].devices
            console.log("Dispositivos actuales de usuario",devices);
            console.log("Posicion a eliminar",positionDev);
            devices.splice(positionDev, 1);
            console.log("Dispositivos tras actualizacion",devices);
            data[positionUser].devices=devices;
            req.session.user.devices=devices //actualizamos la sesion
            //vamos a escribir en nuestro archivo JSON para conservar los datos
            fs.writeFile("./data_base/users.json",JSON.stringify(data, null, 2),(err) => {
                //prime parametro ruta, segundo la data que vamos a escribir, y el tercero estado de error
                if (err) {
                  console.log(err);
                  answer.response = "Error deleting device, try again";
                  res.status(500);
                  res.send(JSON.stringify(answer));
                } else {
                  console.log("Escritura en archivo exitosa");
                  answer.response = "Device successfully deleted";
                  console.log(answer);
                  res.status(200);
                  res.send(JSON.stringify(answer));
                }
              }
            );
          }
        } catch (err) {
          console.log("Error parsing JSON", err);
          answer.response = "Error deleting device, try again";
          res.status(500);
          res.send(JSON.stringify(answer));
        }
      }
    });
  } else {
    answer.response = "Unauthorized action";
    res.status(401);
    res.send(JSON.stringify(answer));
  }
})

//ruta para obtener los dispositivos asociados a tu cuenta conectados
router.route("/connected")
.get((req, res) => {
  console.log("GET /devices/connected");
  res.setHeader("Content-Type", "application/json");
  const answer = {
    response:"",
    devices:[]
  };
  //Verificamos si esta creada la sesion, si lo esta tiene acceso a esta informacion, si no no
  if (req.session.user) {
    const devices = req.session.user.devices;
    const data = [];
    //vemos cual es el id
    devices.forEach((device) => {
      console.log(device);
      const id = device.id;
      data.push(getDevices((metadata) => (metadata.device_id == id)));
    });
    answer.response = "Connected account devices";
    data.forEach(el => {
      if(el!=null){
        el.forEach(device => {
          answer.devices.push(device);
        });
      }
    });
    console.log(answer);
    res.status(200);
    res.send(JSON.stringify(answer));
  } else {
    answer.response = "Unauthorized information";
    res.status(401);
    res.send(JSON.stringify(answer));
  }
});

module.exports = router;
