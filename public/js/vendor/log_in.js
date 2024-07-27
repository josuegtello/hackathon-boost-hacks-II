
import {fetchRequest} from "./fetch_request.js";
import {createToast,initializeToast} from "./notification.js";

const d = document,
      body=document.body;

export function initializeLogin() {
  const inputs = d.querySelectorAll(".input-field");
  const toggle_btn = d.querySelectorAll(".toggle");
  const main = d.querySelector("main");
  const bullets = d.querySelectorAll(".bullets span");
  const $submitBtn=d.querySelectorAll('.sign-btn');
  //Acciones para quitar los inputs de LOG IN y SIGN UP y poner un boton de BACK
  inputs.forEach((inp) => {
    inp.addEventListener("focus", () => {
      inp.classList.add("active");
    });
    inp.addEventListener("blur", () => {
      if (inp.value != "") return;
      inp.classList.remove("active");
    });
  });

  toggle_btn.forEach((btn) => {
    btn.addEventListener("click", () => {
      main.classList.toggle("sign-up-mode");
    });
  });
  bullets.forEach((bullet) => {
    bullet.addEventListener("click", moveSlider);
  });
  $submitBtn.forEach(btn => {
    btn.addEventListener('click',submitFom)
  });
}
function submitFom(e){
  const $form=e.target.closest('form'),
        host=location.hostname,
        route=$form.getAttribute('action'),
        fd=new FormData($form);
  const $inputsRequired=$form.querySelectorAll('[required]');
  let validation=false;
  $inputsRequired.forEach($input => {
    console.log($input.value);
    if($input.value=='') {
      validation=true;
    }
  });
  if(validation==true) return;
  else e.preventDefault();
  console.log(`Enviando formulario a http://${host}:80${route}`);
  fetchRequest({
      method:'POST',
      url:`http://${host}:80${route}`,
      credentials:'include',
      contentType:'application/x-www-form-urlencoded',
      data:new URLSearchParams(fd).toString(),
      async success(response){
        const data=await response.json();
        console.log(`Estado de respuesta ${response.status}`);
        console.log('Informacion recibida');
        console.log(data);
        if(response.ok){  //para respuestas 200
            //TIENE MUCHO MARGEN DE MEJORA ESTO, MEJORAR EN EL TRANSCURSO 
            //vemos si el item existe, si no hacemos la peticion
            sessionStorage.setItem('credentials',JSON.stringify(data.credentials)); //guardo las credenciales
            const homePage=sessionStorage.getItem("Home page");
            if(homePage){//si si existe solo lo insertamos en el document
              console.log('Insertando Home page despues del /sign-in o /sign-up');
              const $main=d.querySelector('main');
              if($main){  //si existe main lo remplazamos
                $main.outerHTML=homePage;
              }
              else{ //si no simplemente insertamos el nuevo menu en el documento
                const $aux=d.createElement('div'),
                      $nav=d.querySelector('nav');
                $aux.innerHTML=homePage;
                const $newMain=$aux.querySelector('main');
                $nav.insertAdjacentElement('afterend',$newMain);
              }
            }
            else{ //no existe debemos hacer una peticion fetch para obtener eso
              fetchRequest({
                method:'GET',
                url:'./assets/html/home_page.html',
                credentials:'include',
                contentType:'text/html',
                data:null,
                async success(response){
                  if(response.ok){  //se obtuvo el recurso
                    console.log('Insertando Home page despues del /sign-in o /sign-up');
                    const html=await response.text(),
                          $main=d.querySelector('main');
                    if($main){  //si existe main lo remplazamos 
                      $main.outerHTML=html;
                    }
                    else{//si no simplemente insertamos el nuevo menu en el documento
                      const $aux=d.createElement('div'),
                            $nav=d.querySelector('nav');
                      $aux.innerHTML=homePage;
                      const $newMain=$aux.querySelector('main');
                      $nav.insertAdjacentElement('afterend',$newMain);
                    }
                  }
                  else{ //no se obtuvo el contenido voy a insertar un Error 404
                    const $main=d.querySelector('main'),
                          error404=sessionStorage.getItem('Error 404'),
                          $aux=d.createElement('div');
                    if($main){  //existe la etiqueta la remplazo
                      if(error404){
                        $aux.innerHTML=error404;
                        const $newMain=$aux.querySelector('main');
                        $main.replaceWith($newMain)
                      }
                      else{
                        console.log('ERROR 404 NOT FOUND en sessionStorage, haciendo la peticion fetch (PENDIENTE)');
                      }
                      
                    }
                    else{
                      //PD: Intente hacerlo con fragmentos y no pude jajaja
                      if(error404){
                        $aux.innerHTML=error404;
                        const $newMain=$aux.querySelector('main'),
                              $nav=d.querySelector('nav');
                        $nav.insertAdjacentElement('afterend',$newMain);
                      }
                      else{
                        console.log('ERROR 404 NOT FOUND en sessionStorage, haciendo la peticion fetch (PENDIENTE)');

                      }
                    }
                  }
                },
                async error(err){
                  console.log('ocurrio un error');
                  console.log(err);
                }
              })
            }

            fetchRequest({  //obtenemos el nav de users
              method:'GET',
              url:'./assets/html/navbar_users.html',
              credentials:'include',
              contentType:'text/html',
              data:null,
              async success(response){
                if(response.ok){
                  const $newNav=await response.text(),
                        $nav=d.querySelector('nav');
                  $nav.outerHTML=$newNav;
                  const $user=d.querySelector('nav [data-type="user"] > span'),
                        credentials=JSON.parse(sessionStorage.getItem('credentials'));
                  $user.textContent=credentials.name;
                  initializeToast();
                }
                else{
                  console.log('ELEMENTO NO ENCONTRADO, lanzar notificacion de error (PENDIENTE');

                }
              },
              async error(err){
                console.log('Ocurrio un error');
                console.log(err);
              }
            })

        }
        else{ //para respuesta diferentes de la 200-299
          //debemos de lanzar la notificacion, ver que error es y lanzar la notificacion FALTA
          console.log('Error, lanzar notificacion de error (PENDIENTE');
          createToast('error',`Error ${response.status}:`,data.response);
        }
      },
      async error(err){
        console.log('ha ocurrido un error');
        console.log(err);
      }
  });
}
/*  Función para la Carousel del LogIn  */
function moveSlider() {
  const bullets = d.querySelectorAll(".bullets span"),
        images = d.querySelectorAll(".image");
  let index = this.dataset.value;
  let currentImage = d.querySelector(`.img-${index}`);
  images.forEach((img) => img.classList.remove("show"));
  currentImage.classList.add("show");
  const textSlider = d.querySelector(".text-group");
  textSlider.style.transform = `translateY(${-(index - 1) * 2.2}rem)`;
  bullets.forEach((bull) => bull.classList.remove("active"));
  this.classList.add("active");
}



/* Función para cargar la home_page */
function loadHomePage() {
  const event = new CustomEvent('loadHomePage');
  document.dispatchEvent(event);
}

/* Función para mostrar la navbar de usuarios y ocultar la navbar principal */
function showUserNavbar(username) { //tambien podemos eliminar esta funcion
  const navbarMain = d.getElementById('navbarMainContainer');
  const navbarUsers = d.getElementById('navbarUsersContainer');
  const userNameSpan = navbarUsers.querySelector('.user-name');
  if (navbarMain) navbarMain.style.display = 'none';
  if (navbarUsers) {
      navbarUsers.style.display = 'flex';
      if (userNameSpan) userNameSpan.textContent = username;
  }
}
/* Función para verificar el estado del usuario y cargar la navbar de usuarios si es necesario */
export async function loadUserNavbar() {    //podemos eliminar esta funcion 
  const host = location.hostname;
  fetchRequest({
      method: 'GET',
      url: `http://${host}:80${route}`,
      credentials: 'include',
      async success(response) {
          if (response.ok) {
              const data = await response.json();
              if (data.isAuthenticated) {
                  showUserNavbar(data.username);  
              }
          } else {
              console.log(`Estado de error ${response.status}`);
              console.log(response);
          }
      },
      async error(err) {
          console.log('Error en la obtención de datos');
          console.error(err);
      }
  });
}