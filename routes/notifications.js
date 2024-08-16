const express = require("express");
const fs = require("fs");
const { validationResult } = require("express-validator");
const router = express.Router();
router.use(express.json());
router.route("/")
.get((req, res) => {
    console.log("GET /notifications");
  res.setHeader("Content-Type", "application/json");
  const errors = validationResult(req),
    answer = {};
  let validation = false;
  if (!errors.isEmpty()) {
    //validamos si lo que recibimos no esta vacio, si no lanzamos un 400
    // Si hay errores, devuélvelos al cliente
    return res
      .status(400)
      .json({ response: "Invalid data format", errors: errors.array() });
  }
  if (req.session.user) {
    fs.readFile("./data_base/users.json", "utf-8", (err, jsonString) => {
      //funcion no bloqueante para leer
      if (err) {
        //lanzar estado de error
        console.log("Error parsing JSON", err);
        answer.response = "Notifications getting error, internal server error";
        res.status(500);
        res.send(JSON.stringify(answer));
      } 
      else {
        //aqui ponemos todo lo que queramos
        try {
          const data = JSON.parse(jsonString); //convertimos el archivo en formato JSON para manipularlo
          const id = req.session.user.id;
          data.forEach((user) => {
            if (user.id == id) {
              //Es el id
              answer.notifications = user.notifications
                ? user.notifications
                : [];
              validation = true;
            }
          });
          if (validation) {
            console.log("Mandando notificaciones");
            console.log(answer);
            answer.response = "User notifications obtained";
            res.status(200);
            res.send(JSON.stringify(answer));
          } 
          else {
            console.log("Usuario no encontrado");
            answer.response = "User not found, id session invalid";
            console.log(answer);
            res.status(400); // FALTA checar bien que posible estado es
            res.send(JSON.stringify(answer));
          }
        } 
        catch (err) {
          console.log("Error parsing JSON", err);
          answer.response =
            "Notifications getting error, internal server error";
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
.delete((req, res) => {
  console.log("DELETE /notifications");
  res.setHeader("Content-Type", "application/json");
  const errors = validationResult(req),
    answer = {};
  let validation = false;
  if (!errors.isEmpty()) {
    //validamos si lo que recibimos no esta vacio, si no lanzamos un 400
    // Si hay errores, devuélvelos al cliente
    return res
      .status(400)
      .json({ response: "Invalid data format", errors: errors.array() });
  }
  if (req.session.user) {
    fs.readFile("./data_base/users.json", "utf-8", (err, jsonString) => {
      //funcion no bloqueante para leer
      if (err) {
        //lanzar estado de error
        console.log("Error parsing JSON", err);
        answer.response = "Error deleting notification, internal server error";
        res.status(500);
        res.send(JSON.stringify(answer));
      } 
      else {
        //aqui ponemos todo lo que queramos
        try {
          const data = JSON.parse(jsonString); //convertimos el archivo en formato JSON para manipularlo
          const id = req.session.user.id;
          const {device,date,type}=req.body
          let userPosition, notificationPosition
          data.forEach((user,index) => {
            if (user.id == id) {
              userPosition=index;
              if(!user.notifications)user.notifications=[];
              user.notifications.forEach((notification,pos )=> {
                if(notification.device==device && notification.date==date && notification.type==type){  //es la notificacion la guardamos
                  console.log("Usuario y notificacion encontrada",user,notification);
                  notificationPosition=pos;
                  validation = true;
                }
              });
              
            }
          });
          if (validation) {
            //FALTA escribir el archivo y eliminar exactamente esa posicion
            const notifications=data[userPosition].notifications
            console.log("Notificaciones actuales de usuario",notifications);
            console.log("Posicion a eliminar",notificationPosition);
            notifications.splice(notificationPosition, 1);
            console.log("Notificaciones tras actualizacion",notifications);
            data[userPosition].notifications=notifications;
            //Guardamos el archivo
            fs.writeFile("./data_base/users.json",JSON.stringify(data, null, 2),(err) => {
              //prime parametro ruta, segundo la data que vamos a escribir, y el tercero estado de error
              if (err) {
                console.log(err);
                answer.response = "Error deleting notification, try again";
                res.status(500);
                res.send(JSON.stringify(answer));
              } else {
                console.log("Escritura en archivo exitosa");
                answer.response = "Notification successfully deleted";
                console.log(answer);
                res.status(200);
                res.send(JSON.stringify(answer));
              }
            });
          } 
          else {
            console.log("Usuario no encontrado");
            answer.response = "User not found, id session invalid or data invalid";
            console.log(answer);
            res.status(400); // FALTA checar bien que posible estado es
            res.send(JSON.stringify(answer));
          }
        } 
        catch (err) {
          console.log("Error parsing JSON", err);
          answer.response =
            "Error deleting notification, internal server error";
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
module.exports = router;
