const express=require('express');
const fs=require("fs");
const { validationResult } = require('express-validator');
//const { body, validationResult } = require('express-validator');
let router=express.Router();
//Middleware para parsear los datos que recibamos
router.use(express.urlencoded({ extended: true })); // Para datos de formularios URL-encoded
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
              answer.response='Error creating user, try again';
              res.status(500);
              res.send(JSON.stringify(answer));
            }
            else{ //aqui ponemos todo lo que queramos
              try {
                const data=JSON.parse(jsonString);  //convertimos el archivo en formato JSON para manipularlo
                //console.log(data);
                //console.log(req.body)
                const {name,password,email}=req.body;  //obtenemos los datos de usuario por destructuracion
                console.log('data recibida',name,password,email);
                if(!name || !password || !email){ //si algunos de los datos no existe
                  res.status(400);
                  res.send(JSON.stringify({response:"Invalida data format"}));
                  return;
                }
                if(name=="" || password=="" || email==""){ //si alguno de los datos esta vacio
                  res.status(400);
                  res.send(JSON.stringify({response:"Invalida data format"}));
                  return;
                }
                data.forEach(user => {  //verificamos si el nombre de usuario o correo ya existen
                  if(user.name==name){  //tenemos un nombre de usuario igual
                    validation=true;
                    answer.name='Username already registered';
                  }
                  if(user.email==email){ //tenemos un email igual
                    validation=true;
                    answer.email='Email already registered';
                  }
                });  
                if(validation==true){ //mandamos el estado de error, se esta repitiendo la informacion
                  console.log('Data repetida, respuesta a enviar');
                  answer.response='Repeated data';
                  console.log(answer);
                  res.status(422);
                  res.send(JSON.stringify(answer));
                }
                else{ //escribimos en nuestro archivo JSON
                  const id=uuidv4();  //creamos un id unico para este usuario
                  data.push({
                    id:id,
                    name:name,
                    email:email,
                    password:password,
                    devices:[]
                  });
                  //FALTA crear una sesion
                  answer.credentials={
                    name:name,
                  }
                  //vamos a escribir en nuestro archivo JSON para conservar los datos
                  fs.writeFile('./data_base/users.json',JSON.stringify(data,null,2),err=>{ //prime parametro ruta, segundo la data que vamos a escribir, y el tercero estado de error
                    if(err){
                      console.log(err);
                      answer.response='Error creating user, try again';
                      answer.credentials=null;  //anulamos las credenciales hubo un error
                      res.status(500);
                      res.send(JSON.stringify(answer));
                    }
                    else{
                      console.log("Escritura en archivo exitosa")
                      answer.response='User created successfully';
                      console.log(answer)
                      res.status(201);
                      res.send(JSON.stringify(answer));
                    }
                  })
                }
              } 
              catch (err) {
                console.log('Error parsing JSON',err) ;
                answer.response='Error creating user, try again';
                res.status(500);
                res.send(JSON.stringify(answer));
              }
              
            }
        })

    })
function uuidv4() { //genero un ID unico para cada cliente wenSocket que tenga para poder identificarlos
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}
module.exports=router;