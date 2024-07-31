const express=require('express');
const fs=require("fs");
const { validationResult } = require('express-validator');
//const { body, validationResult } = require('express-validator');
const router=express.Router();
//Middleware para parsear los datos que recibamos
router.use(express.json());
router
    .route('/')
    .post((req,res)=>{
        res.setHeader('Content-Type','application/json');
        const   errors=validationResult(req),
                answer={};
        let validation=false;
        if (!errors.isEmpty()) {  //validamos si lo que recibimos no esta vacio, si no lanzamos un 400
            // Si hay errores, devuélvelos al cliente
            return res.status(400).json({response:'Invalid data format',errors: errors.array() });
        }
        //leemos el archivo de nuestra base de datos
        fs.readFile('./data_base/users.json','utf-8',(err,jsonString)=>{  //funcion no bloqueante para leer
            if(err){//lanzar estado de error
              console.log(err);
              answer.response='Error searching device, try again';
              res.status(500);
              res.send(JSON.stringify(answer));
            }
            else{ //aqui ponemos todo lo que queramos
              try {
                const data=JSON.parse(jsonString);  //convertimos el archivo en formato JSON para manipularlo
                //console.log(data);
                //console.log(req.body)
                const {id}=req.body;  //obtenemos el id que nos mando el dispositivo IoT
                console.log('data recibida',id);
                if(!id){ //si el id no existe
                  res.status(400);
                  res.send(JSON.stringify({response:"Invalida data format"}));
                  return;
                }
                if(id==""){ //si el id esta vacio
                  res.status(400);
                  res.send(JSON.stringify({response:"Invalida data format"}));
                  return;
                }
                data.forEach(user => {  //verificamos si el nombre y la contraseña coincide con 
                    user.devices.forEach(device => {
                        if(device.id==id){  //es igual al id de uno de los clientes
                            validation=true;
                            answer.credentials={user_id:user.id};//le pasamos el id del cliente para que sepa que es dispositivo de ese cliente
                            //Creamos la sesion
                            req.session.device={
                                id:id,
                                user_id:user.id,
                                type:device.type
                            }
                        }
                    });
                });  
                if(validation==true){ //enviamos al dispositivo su "credencial" y cookie
                    console.log('Dispositivo encontrado encontrado');
                    answer.response='Device found';
                    console.log(answer);
                    res.status(200);
                    res.send(JSON.stringify(answer));
                }
                else{ //escribimos en nuestro archivo JSON
                    console.log('Dispositivo no encontrado');
                    answer.response='Invalid credentials';
                    console.log(answer);
                    res.status(401);
                    res.send(JSON.stringify(answer));
                }
              } 
              catch (err) {
                console.log('Error parsing JSON',err) ;
                answer.response='Error searching device, try again';
                res.status(500);
                res.send(JSON.stringify(answer));
              }    
            }
        })
    })
module.exports=router;