import {dinamicHTML} from "./vendor/dinamic_html.js";
import {startCursor,startLinks} from "./vendor/cursor.js";
import {sleep} from "./vendor/sleep.js";
const   d=document,
w=window,
body=d.body;

//Funciones generales
const getHTMLElements=function(){
    const $targets=d.querySelectorAll('[data-html]');
    $targets.forEach(el => {
        const url=el.getAttribute('data-html'),
                action=el.getAttribute('data-html-action');
        console.log(el,url,action)
        dinamicHTML({
            url:url,
            method:'GET',
            contentType:'text/html',
            async success(response){
                if(response.ok){//200-299
                    //respuesta exitoso
                    console.log('peticion exitosa')
                    const $html=await response.text();
                    console.log($html)
                    if(action=='replace'){
                        el.outerHTML=$html;
                    }
                    else if(action=='insert'){
                        el.appendChild($html)
                    }
                    startLinks();
                }
                else{ //401,404
                    console.log('Error en la peticion')
                    console.log(response);

                }
            },
            async error(err){ //500,505
                console.log('Error en la obtencion de datos');
                console.error(err);
            }
        })
    });
};




d.addEventListener('DOMContentLoaded',async e=>{
    startCursor();
    getHTMLElements();
    
    body.addEventListener('click',e=>{
        const $target=e.target;
        
    });
})