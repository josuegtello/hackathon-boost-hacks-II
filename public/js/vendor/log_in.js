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