const express = require("express");
const fs = require("fs");
const { validationResult } = require("express-validator");
const router = express.Router();
router.use(express.json());
router.route("/").get((req, res) => {
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
});
module.exports = router;
