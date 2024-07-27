const d=document;
import {fetchRequest} from "./fetch_request.js";
import {createToast} from "./notification.js";
export const error404=async function(){
    const $main=d.querySelector('main'),
    $aux=d.createElement('div');
    let error404=sessionStorage.getItem('Error 404')
    if(!error404){  //si no existe hacemos llamado de el y lo guardamos en sessionStorage
        fetchRequest({
            method:'GET',
            url:'./assets/html/error_404.html',
            credentials:'include',
            contentType:'text/html',
            data:null,
            async success(response){
                if(response.ok){    //almacenamos la informacion 
                    const data=await response.text();
                    error404=data;
                    sessionStorage.setItem('Error 404');
                }
                else{
                    createToast('error',`Error ${response.status}:`,'Error file not found');
                }
            },
            async error(err){
                console.log('Ocurrio un error en la peticion');
                console.error(err);
            }
        });
    }
    if($main){  //existe la etiqueta la remplazo
        $aux.innerHTML=error404;
        const $newMain=$aux.querySelector('main');
        $main.replaceWith($newMain);                    
    }
    else{   //no existe un main, lo insertamos despues del nav
        //PD: Intente hacerlo con fragmentos y no pude jajaja
        $aux.innerHTML=error404;
        const   $newMain=$aux.querySelector('main'),
                $nav=d.querySelector('nav');
        $nav.insertAdjacentElement('afterend',$newMain);
    }
}