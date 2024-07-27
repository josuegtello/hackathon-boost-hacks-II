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
                    else if(action=='save'){
                        const name=el.getAttribute('data-name');
                        const item=sessionStorage.getItem(name);
                        if(!item) sessionStorage.setItem(name,$html);
                        el.remove();
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
                const redirect=$el.getAttribute('data-redirect')
                if(redirect=='replace-main'){   //cuando el atributo tenga esta valor remplazara la etiqueta main
                    console.log('Remplazando etiqueta main')
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
                else if(redirect=='submenu'){   //cuando tenga este valor nos traera un submenu de ese enlace
                    console.log('Insertando submenu');
                    const   submenu=await response.text(),
                            rect = $el.getBoundingClientRect(),
                            $aux=d.createElement('div');
                    $aux.innerHTML=submenu;
                    
                    if(url.includes('profile_drop')){   
                        const $submenu=$aux.querySelector('.submenu'); 
                        $submenu.style.setProperty('left',`${rect.right}px`);
                        $el.setAttribute('data-state','showing');
                        body.appendChild($submenu);
                    }
                    else if(url.includes('notification_menu')){
                        const $submenu=$aux.querySelector('.submenu');
                        $submenu.style.setProperty('left',`${rect.right + rect.width}px`);
                        $el.setAttribute('data-state','showing');
                        body.appendChild($submenu);
                    }
                    else if(url.includes('another_menu')){
                        const $submenu=$aux.querySelector('.submenu');
                        $submenu.style.setProperty('left',`${rect.right + rect.width}px`);
                        $el.setAttribute('data-state','showing');
                        body.appendChild($submenu);
                    }

                    /*
                    console.log(rect);
                    console.log('Top:', rect.top);
                    console.log('Left:', rect.left);
                    console.log('Right',rect.right);
                    console.log('Buttom',rect.buttom);
                    console.log('Width:', rect.width);
                    console.log('Height:', rect.height);
                    */
                }
            }
            else{//300-499
                console.log(`Estado de error ${response.status}`);
                console.log(response);
                const $main=d.querySelector('main');
                if($main){
                    const error404=sessionStorage.getItem('Error 404'),
                          $aux=d.createElement('div');
                    $aux.innerHTML=error404;
                    const $newMain=$aux.querySelector('main');
                    $main.replaceWith($newMain)
                }
                else{
                    const error404=sessionStorage.getItem('Error 404'),
                          $aux=d.createElement('div');
                    //PD: Intente hacerlo con fragmentos y no pude jajaja
                    $aux.innerHTML=error404;
                    const $newMain=$aux.querySelector('main');
                    body.appendChild($newMain)
                }
            }
            startLinks();
        },
        async error(err){   //500
            console.log('Error en la obtencion de datos');
            console.log(err);
        }
    })
}

function removeElement(e){
    const $target=e.target;
    $target.remove();
}

d.addEventListener('DOMContentLoaded',async e=>{
    startCursor();
    getHTMLElements();
    initializeToast();

    body.addEventListener('click',(e)=>{
        const $target=e.target;
        if($target.matches('[data-redirect]')||($target.matches('[data-redirect] *'))){//para los enlaces del nav
            console.log("redireccionando...");
            e.preventDefault();
            //para los que muestren submenus
            console.log($target.closest('a').getAttribute('data-state'))
            if($target.closest('[data-redirect]').getAttribute('data-state')=='showing'){  //queremos ocultar el menu
                const $submenu=d.querySelector('.submenu'),
                    $link=$target.closest('[data-redirect]');
                $submenu.classList.add('submenu-out');
                $submenu.addEventListener('animationend',removeElement);
                $link.setAttribute('data-state','hidden');
                return;
            }
            else{   //es otro menu igual removemos el submenu
                const $submenu=d.querySelector('.submenu'),
                        $link=d.querySelector('[data-state="showing"]');
                if($link){
                    $link.setAttribute('data-state','hidden');
                    console.log($link)
                    if($submenu) {
                        $submenu.classList.add('submenu-out');
                        $submenu.addEventListener('animationend',removeElement);
                    }
                }
                
            }
            redirects($target.closest("[data-redirect]"),e);
        }
        //verificacion de los submenus, si existe y le di click a alguna otra cosa lo remuevo
        if(d.querySelector('.submenu')&&($target!=d.querySelector("[data-state='showing']"))){
            const $submenu=d.querySelector('.submenu'),
            $link=d.querySelector("[data-state='showing']");
            if($link)$link.setAttribute('data-state','hidden');
            $submenu.classList.add('submenu-out');
            $submenu.addEventListener('animationend',removeElement);
        }
    });
})