const express = require("express");
const fs = require("fs");
const path = require("path");
const { validationResult } = require("express-validator");
const router = express.Router();
const fileUpload = require("express-fileupload");
//Middleware para parsear los datos que recibamos
router.use(fileUpload());
router.use(express.urlencoded({ extended: true })); // Para datos de formularios URL-encoded
router.use(express.json({ limit: "10mb" }));
//Middleware para guardar la imagen o eliminarla
// Crear la carpeta 'public/assets/profile_img' si no existe
const uploadDir = path.join(__dirname, "../public/assets/profile_img");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

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
              //buscamos el id para enviar
              if (id == user.id) {
                //es el usuario
                //Obtenemos la informacion
                const { name, email, phone, profile_img } = user;
                console.log(name, email);
                answer.credentials = {
                  name: name,
                  email: email,
                  phone: phone,
                  profile_img: profile_img,
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
              res.status(400); // FALTA checar bien que posible estado es
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
    if (req.session && req.session.user) {
      //Esta accion la podran hacer unicamente usuarios web
      //obtenemos la data
      const { name, password, email, phone } = req.body; //obtenemos los datos de usuario por destructuracion
      let fileName;
      const id = req.session.user.id;
      console.log("data recibida", name, password, email);
      if (
        !name ||
        !password ||
        !email ||
        name == "" ||
        password == "" ||
        email == ""
      ) {
        //si algunos de los datos no existe o vienen vacios enviamos estado de error
        res.status(400);
        res.send(JSON.stringify({ response: "Invalid data format" }));
        return;
      }
      if (password != req.session.user.password) {
        //si no coincide no realizamos la operacion
        res.status(400);
        res.send(JSON.stringify({ response: "Incorrect password" }));
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
            //primero checamos si el username no existe
            data.forEach((user) => {
              if (user.name == name && user.id != id) {
                validation = true;
              }
            });
            if (validation == true) {
              answer.response = "user name already registered";
              console.log(answer);
              res.status(400);
              res.send(JSON.stringify(answer));
              return;
            }
            data.forEach((user, index) => {
              //buscamos el id para actualizar
              if (id == user.id) {
                //es el usuario
                //Actualizamos la informacion
                user.name = name;
                user.email = email;
                user.password = password;
                if(phone)user.phone = phone;
                //poner la validacion de si existe img
                if (req.files && req.files.image) {
                  console.log("guardando imagen");
                  //si ya existe una imagen vamos a borrarla
                  const oldFileName = user.profile_img;
                  if (oldFileName) {
                    //si esta definido lo borramos
                    const filePath = path.join(__dirname,"../public/assets/profile_img",oldFileName);
                    fs.unlink(filePath, (err) => {
                      if (err) {
                        if (err.code === "ENOENT") {
                          // Archivo no encontrado
                          console.log("Imagen no encontrada");
                          //return;
                        }
                        // Otro error
                        console.log({
                          response: "Error deleated profile image",
                          error: err.message,
                        })
                        //return;
                      }
                      // Archivo eliminado con éxito
                      console.log(`Imagen ${oldFileName} eliminada con exito`);
                    });
                  }
                  //procedemos a guardar la nueva imagen que llego
                  const image = req.files.image;
                  const ext = path.extname(image.name);
                  fileName = `user${index}${ext}`;
                  const filePath = path.join(uploadDir, fileName);
                  validation=true;
                  image.mv(filePath, (err) => {
                    if (err) {
                      console.log("Error uploaded profile image");
                      answer.response="Error uploaded profile image"
                      fileName=null;
                      validation=false;
                    }
                  });
                  answer.profile_img = fileName
                    ? `./assets/profile_img/${fileName}`
                    : null;
                  user.profile_img = fileName ? fileName : null;
                }
                else{
                  validation = true;
                }
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
              if (!answer.response)answer.response = "User not found, id session invalid";
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
    let position = -1;
    if (!errors.isEmpty()) {
      // validamos si lo que recibimos no esta vacio, si no lanzamos un 400
      // Si hay errores, devuélvelos al cliente
      return res
        .status(400)
        .json({ response: "Invalid data format", errors: errors.array() });
    }
    if (req.session && req.session.user) {
      //Esta accion la podran hacer unicamente usuarios web

      const { password } = req.body;
      if (password != req.session.user.password) {
        //si no coinicide no realizamos la operacion
        res.status(400);
        res.send(JSON.stringify({ response: "Incorrect password" }));
        return;
      }

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
            data.forEach((user, index) => {
              //buscamos el id para eliminar
              if (id == user.id) {
                //es el usuario
                validation = true; //ponemos a true para que realmente lo eliminemos
                position = index; //obtenemos la posicion de ese usuario para borrarlo
              }
            });
            if (validation) {
              //Eliminamos al usuario
              //tratamos de eliminar el archivo
              const fileName = data[position].profile_img;
              if (fileName) {
                //si esta definido lo borramos
                const filePath = path.join(
                  __dirname,
                  "../public/assets/profile_img",
                  fileName
                );
                fs.unlink(filePath, (err) => {
                  if (err) {
                    if (err.code === "ENOENT") {
                      // Archivo no encontrado
                      return res
                        .status(404)
                        .json({ response: "Image profile file not found" });
                    }
                    // Otro error
                    return res.status(500).json({
                      response: "Error deleated profile image",
                      error: err.message,
                    });
                  }
                  // Archivo eliminado con éxito
                });
              }
              // Si eso sale bien Usamos el método splice para eliminar al usuario
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
                        answer.response =
                          "Error deleted user,internal server error";
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
//Ruta especifica para la contraseña
router.route("/password").put((req, res) => {
  console.log("PUT /profile/password");
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
    //Esta accion la podran hacer unicamente usuarios web
    //obtenemos la data
    const { password, newPassword } = req.body; //obtenemos los datos de usuario por destructuracion
    const id = req.session.user.id;
    console.log("data recibida", password, newPassword);
    if (!password || !newPassword || password == "" || newPassword == "") {
      //si algunos de los datos no existe o vienen vacios enviamos estado de error
      res.status(400);
      res.send(JSON.stringify({ response: "Invalid data format" }));
      return;
    }
    if (password != req.session.user.password) {
      res.status(400);
      res.send(JSON.stringify({ response: "Incorrect password" }));
      return;
    }
    //leemos el archivo de nuestra base de datos
    fs.readFile("./data_base/users.json", "utf-8", (err, jsonString) => {
      //funcion no bloqueante para leer
      if (err) {
        //lanzar estado de error
        console.log(err);
        answer.response = "Error updating password, internal server error";
        res.status(500);
        res.send(JSON.stringify(answer));
      } else {
        //aqui ponemos todo lo que queramos
        try {
          const data = JSON.parse(jsonString); //convertimos el archivo en formato JSON para manipularlo

          data.forEach((user, index) => {
            //buscamos el id para actualizar
            if (id == user.id) {
              //es el usuario
              //Actualizamos la informacion
              user.password = newPassword;
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
                    "Error updating password, internal server error";
                  res.status(500);
                  res.send(JSON.stringify(answer));
                  validation = false;
                } else {
                  console.log("Usuario encontrado y actualizado");
                  //actualizamos las sesiones
                  req.session.user.password = password;
                  answer.response = "password successfully updated";
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
          answer.response = "Error updating password,internal server error";
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
