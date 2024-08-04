const express = require("express");
const fs = require("fs");
const { validationResult } = require("express-validator");
//const { body, validationResult } = require('express-validator');
const router = express.Router();
//Middleware para parsear los datos que recibamos
router.use(express.urlencoded({ extended: true })); // Para datos de formularios URL-encoded
router.use(express.json());
router.route("/").post((req, res) => {
  console.log("POST /sign-in");
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
  //leemos el archivo de nuestra base de datos
  fs.readFile("./data_base/users.json", "utf-8", (err, jsonString) => {
    //funcion no bloqueante para leer
    if (err) {
      //lanzar estado de error
      console.log(err);
      answer.response = "Error searching user, try again";
      res.status(500);
      res.send(JSON.stringify(answer));
    } else {
      //aqui ponemos todo lo que queramos
      try {
        const data = JSON.parse(jsonString); //convertimos el archivo en formato JSON para manipularlo
        //console.log(data);
        //console.log(req.body)
        const { name, password } = req.body; //obtenemos los datos de usuario por destructuracion
        console.log("data recibida", name, password);
        if (!name || !password) {
          //si algunos de los datos no existe
          res.status(400);
          res.send(JSON.stringify({ response: "Invalida data format" }));
          return;
        }
        if (name == "" || password == "") {
          //si alguno de los datos esta vacio
          res.status(400);
          res.send(JSON.stringify({ response: "Invalida data format" }));
          return;
        }
        data.forEach((user) => {
          //verificamos si el nombre y la contraseña coincide con alguno de nuestra "base de datos"
          if (user.name == name && user.password == password) {
            validation = true;
            
            const { id, email, devices,profile_img } = user;
            answer.credentials = { 
              name: name,
              profile_img:profile_img 
            };
            //Creamos la sesion
            req.session.user = {
              id: id,
              type: "web user",
              name: name,
              password:password,
              email: email,
              devices: devices?devices:[],
            };
            //req.session.device="web user";
            console.log("Session after sign in:", req.session);
          }
        });
        if (validation == true) {
          //procedemos a crear una sesion y enviarle al usuario su "credencial"
          console.log("Usuario encontrado");
          answer.response = "User found";
          console.log(answer);
          res.status(200);
          res.send(JSON.stringify(answer));
        } else {
          //escribimos en nuestro archivo JSON
          console.log("Usuario no encontrado");
          answer.response = "Invalid credentials";
          console.log(answer);
          res.status(401);
          res.send(JSON.stringify(answer));
        }
      } catch (err) {
        console.log("Error parsing JSON", err);
        answer.response = "Error searching user, try again";
        res.status(500);
        res.send(JSON.stringify(answer));
      }
    }
  });
});
module.exports = router;
