const express = require("express");
const { validationResult } = require("express-validator");

const router = express.Router();

router.use(express.json()); 

router.post((req,res)=>{
    console.log("POST /password");
    res.setHeader("Content-Type", "application/json");
    const errors = validationResult(req),
      answer = {};
    if (!errors.isEmpty()) {
      //validamos si lo que recibimos no esta vacio, si no lanzamos un 400
      // Si hay errores, devuélvelos al cliente
      return res
        .status(400)
        .json({ response: "Invalid data format", errors: errors.array() });
    } 
    if (req.session.user){  //si tiene una sesion hacemos la verificacion
        const {password} = req.body;
        if(!password || password==""){
            res.status(400);
            res.send(JSON.stringify({ response: "Invalid data format" }));
            return;
        }
        if(password==req.session.user.password) {
            answer.response="Correct password";
            console.log(answer);
            res.status(200);
            res.send(JSON.stringify(answer));
        }
        else {
            answer.response = "Incorrect password";
            console.log(answer);
            res.status(400);
            res.send(JSON.stringify(answer));
        }
    }
    else{   //no tiene ni porque andar haciendo peticiones aqui saludos
        answer.response = "Unauthorized action";
        res.status(401);
        res.send(JSON.stringify(answer));
    }
})
module.exports = router;
