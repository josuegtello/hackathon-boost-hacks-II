import {fetchRequest} from "./fetch_request.js";

const d = document;

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
  e.preventDefault();
  const $form=e.target.closest('form'),
        host=location.hostname,
        route=$form.getAttribute('action'),
        fd=new FormData($form);
  console.log(`Enviando formulario a http://${host}:80${route}`);
  fetchRequest({
      method:'POST',
      url:`http://${host}:80${route}`,
      credentials:'include',
      contentType:'application/x-www-form-urlencoded',
      data:new URLSearchParams(fd).toString(),
      async success(response){
        console.log(`Estado de respuesta ${response.status}`);
        if(response.ok){
          const data=await response.json();
          console.log('Informacion recibida');
          console.log(data);
          /*  navbar_users | loadHomepage | clearFormFields */
          showUserNavbar();
          loadHomePage();
        }
        else{
          console.log(response);
        }
      },
      async error(err){
        console.log('ha ocurrido un error');
        console.log(err)
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
function showUserNavbar(username) {
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
export async function loadUserNavbar() {
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