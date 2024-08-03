const express = require("express");
const fs = require("fs");
const { validationResult } = require("express-validator");
const router = express.Router();
//Middleware para parsear los datos que recibamos
router.use(express.urlencoded({ extended: true })); // Para datos de formularios URL-encoded
router.use(express.json());
router
  .route("/")
  .get((req, res) => {
    console.log("GET /profile");
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
    if (req.session && req.session.user) {
      //obtenemos la data
      const id = req.session.user.id;
      //leemos el archivo de nuestra base de datos
      fs.readFile("./data_base/users.json", "utf-8", (err, jsonString) => {
        //funcion no bloqueante para leer
        if (err) {
          //lanzar estado de error
          console.log(err);
          answer.response = "User getting error, internal server error";
          res.status(500);
          res.send(JSON.stringify(answer));
        } else {
          //aqui ponemos todo lo que queramos
          try {
            const data = JSON.parse(jsonString); //convertimos el archivo en formato JSON para manipularlo
            //console.log(data);
            //console.log(req.body)
            data.forEach((user) => {
              //buscamos el id para actualizar
              if (id == user.id) {
                //es el usuario
                //Actualizamos la informacion
                const { name, email, password, devices } = user;
                console.log(name, email, password, devices);
                answer.credentials = {
                  name: name,
                  email: email,
                  password: password,
                  devices: devices,
                };
                validation = true;
              }
            });
            if (validation) {
              console.log("Usuario encontrado");
              console.log(answer);
              answer.response = "User information obtained";
              res.status(200);
              res.send(JSON.stringify(answer));
            } else {
              console.log("Usuario no encontrado");
              answer.response = "User not found, id session invalid";
              console.log(answer);
              res.status(400); //checar bien que posible estado es
              res.send(JSON.stringify(answer));
            }
          } catch (err) {
            console.log("Error parsing JSON", err);
            answer.response = "User getting error,internal server error";
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
  .put((req, res) => {
    console.log("PUT /profile");
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
    if (req.session && req.session.user) {  //Esta accion la podran hacer unicamente usuarios web
      //obtenemos la data
      const { name, password, email, devices } = req.body; //obtenemos los datos de usuario por destructuracion
      const id = req.session.user.id;
      console.log("data recibida", name, password, email, devices);
      if (
        !name ||
        !password ||
        !email ||
        !devices ||
        name == "" ||
        password == "" ||
        email == ""
      ) {
        //si algunos de los datos no existe o vienen vacios enviamos estado de error
        res.status(400);
        res.send(JSON.stringify({ response: "Invalid data format" }));
        return;
      }
      //leemos el archivo de nuestra base de datos
      fs.readFile("./data_base/users.json", "utf-8", (err, jsonString) => {
        //funcion no bloqueante para leer
        if (err) {
          //lanzar estado de error
          console.log(err);
          answer.response = "Error updating user, internal server error";
          res.status(500);
          res.send(JSON.stringify(answer));
        } else {
          //aqui ponemos todo lo que queramos
          try {
            const data = JSON.parse(jsonString); //convertimos el archivo en formato JSON para manipularlo

            data.forEach((user) => {
              //buscamos el id para actualizar
              if (id == user.id) {
                //es el usuario
                //Actualizamos la informacion
                user.name = name;
                user.email = email;
                user.password = password;
                user.devices = devices;
                //actualizamos la informacion de la sesion
                validation = true;
              }
            });
            if (validation) {
              //Actualizamos el archivo
              fs.writeFile(
                "./data_base/users.json",
                JSON.stringify(data, null, 2),
                (err) => {
                  //prime parametro ruta, segundo la data que vamos a escribir, y el tercero estado de error
                  if (err) {
                    console.log(err);
                    answer.response =
                      "Error updating user, internal server error";
                    res.status(500);
                    res.send(JSON.stringify(answer));
                    validation = false;
                  } else {
                    console.log("Usuario encontrado y actualizado");
                    //actualizamos las sesiones
                    req.session.user.name = name;
                    req.session.user.email = email;
                    req.session.user.password = password;
                    req.session.user.devices = devices;
                    answer.response = "user successfully updated";
                    console.log(answer);
                    res.status(200);
                    res.send(JSON.stringify(answer));
                    validation = true;
                  }
                }
              );
            } else {
              console.log("Usuario no encontrado");
              if (answer.response)
                answer.response = "User not found, id session invalid";
              console.log(answer);
              res.status(400); //checar bien que posible estado es
              res.send(JSON.stringify(answer));
            }
          } catch (err) {
            console.log("Error parsing JSON", err);
            answer.response = "Error updating user,internal server error";
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
    console.log("DELETE /profile");
    res.setHeader("Content-Type", "application/json");
    const errors = validationResult(req),
      answer = {};
    let validation = false;
    let position=-1;
    if (!errors.isEmpty()) {
      // validamos si lo que recibimos no esta vacio, si no lanzamos un 400
      // Si hay errores, devuélvelos al cliente
      return res
        .status(400)
        .json({ response: "Invalid data format", errors: errors.array() });
    }
    if (req.session && req.session.user) {  //Esta accion la podran hacer unicamente usuarios web
      //obtenemos el id
      const id = req.session.user.id;
      //leemos el archivo de nuestra base de datos
      fs.readFile("./data_base/users.json", "utf-8", (err, jsonString) => {
        //funcion no bloqueante para leer
        if (err) {
          //lanzar estado de error
          console.log(err);
          answer.response = "Error deleted user, internal server error";
          res.status(500);
          res.send(JSON.stringify(answer));
        } else {
          //aqui ponemos todo lo que queramos
          try {
            const data = JSON.parse(jsonString); //convertimos el archivo en formato JSON para manipularlo
            data.forEach((user,index) => {
              //buscamos el id para eliminar
              if (id == user.id) {
                //es el usuario
                validation = true;  //ponemos a true para que realmente lo eliminemos
                position=index; //obtenemos la posicion de ese usuario para borrarlo
              }
            });
            if (validation) {
              //Eliminamos al usuario
              // Usamos el método splice
              data.splice(position, 1);
              //Actualizamos el archivo
              fs.writeFile(
                "./data_base/users.json",
                JSON.stringify(data, null, 2),
                (err) => {
                  //primer parametro ruta, segundo la data que vamos a escribir, y el tercero estado de error
                  if (err) {
                    console.log(err);
                    answer.response =
                      "Error deleted user, internal server error";
                    res.status(500);
                    res.send(JSON.stringify(answer));
                  } else {
                    //eliminamos la sesion 
                    req.session.destroy((err) => {
                      if (err) {
                        answer.response = "Error deleted user,internal server error";
                        res.status(500);
                        res.send(JSON.stringify);
                      } else {
                        console.log("Usuario encontrado y eliminado");
                        answer.response = "User successfully deleted";
                        console.log(answer);
                        res.status(200);
                        res.send(JSON.stringify(answer));
                      }
                    });
                    
                  }
                }
              );
            } else {
              console.log("Usuario no encontrado");
              if (answer.response)
                answer.response = "User not found, id session invalid";
              console.log(answer);
              res.status(400); //checar bien que posible estado es
              res.send(JSON.stringify(answer));
            }
          } catch (err) {
            console.log("Error parsing JSON", err);
            answer.response = "Error deleted user,internal server error";
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
  });
module.exports = router;
