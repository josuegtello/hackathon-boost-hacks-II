const express=require('express');
//const { body, validationResult } = require('express-validator');
let router=express.Router();

router.use(express.urlencoded({ extended: true })); // Para datos de formularios URL-encoded
router.route('/')
    .post((req,res)=>{


    })


module.exports=router;