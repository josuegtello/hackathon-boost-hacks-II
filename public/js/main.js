import {dinamicHTML} from "./vendor/dinamic_html.js";
import {startCursor,startLinks} from "./vendor/cursor.js";
import {sleep} from "./vendor/sleep.js";
import {initializeLogin} from "./vendor/log_in.js";
import {fetchRequest} from "./vendor/fetch_request.js";
import {initializeToast} from "./vendor/notification.js";


const   d = document,
        w = window,
        body = d.body;

//Funciones generales
const getHTMLElements=function(){
    const $targets=d.querySelectorAll('[data-html]');
    $targets.forEach(el => {
        const url=el.getAttribute('data-html'),
                action=el.getAttribute('data-html-action');
        console.log(`Iniciando peticion en la ruta ${url}`)
        dinamicHTML({
            url:url,
            method:'GET',
            contentType:'text/html',
            async success(response){
                if(response.ok){//200-299
                    //respuesta exitoso
                    console.log('peticion exitosa')
                    const $html=await response.text();
                    if(action=='replace'){
                        el.outerHTML=$html;
                    }
                    else if(action=='insert'){
                        el.appendChild($html)
                    }
                    startLinks();
                }
                else{ //300-499
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
const redirects=async function($el,e){
    e.preventDefault();
    const url=$el.getAttribute('href')
    console.log(url)
    fetchRequest({
        method:'GET',
        url:url,
        contentType:'text/html',
        body:null,
        credentials:'include',
        async success(response){
            if(response.ok){    //200-299
                const $main=d.querySelector('main'),
                    $html=await response.text();
                $main.outerHTML=$html;
                //es estos if inicializamos los datos
                if(url.includes('log_in')){
                    console.log('log in obtenido')
                    initializeLogin();
                }
                else if(url.includes('home_page')){
                    console.log('home page obtenido')
                    //funcion para inicializar los eventos del home page
                }
            }
            else{//300-499
                console.log(`Estado de error ${response.status}`);
                console.log(response)
            }
        },
        async error(err){   //500
            console.log('Error en la obtencion de datos');
            console.log(err);
        }
    })

}



d.addEventListener('DOMContentLoaded',async e=>{
    startCursor();
    getHTMLElements();
    initializeToast();

    body.addEventListener('click',(e)=>{
        const $target=e.target;
        
        if($target.matches('[data-redirect]')||($target.matches('[data-redirect] *'))){//para los enlaces del nav
            console.log("redireccionando...");
            redirects($target.closest("[data-redirect]"),e);
        } 
    });
})