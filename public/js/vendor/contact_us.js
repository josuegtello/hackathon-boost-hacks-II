//js que tiene la seccion de contact_us

const d = document;
// Variable para controlar el estado de cierre
let isClosing = false;

export const initializateContactUs = function () {
  const contactLink = d.getElementById("contactLink");
  const closeButton = d.getElementById("close-popup");
  const popup = d.getElementById("contact-form-popup");

  // Abrir la ventana emergente al hacer clic en "Contact Us"
  contactLink.addEventListener("click", openModal);

  // Cerrar la ventana emergente al hacer clic en la "X"
  closeButton.addEventListener("click", closeModal);
  // Cerrar la ventana emergente si se hace clic fuera del contenido
  window.addEventListener("click", function (event) {
    if (event.target === popup) {
      closeModal();
    }
  });
  openModal();
};
// Función para cerrar la ventana emergente
function closeModal() {
  const popup = d.getElementById("contact-form-popup");
  const popupContent = d.querySelector(".popup-content");
  if (!isClosing) {
    isClosing = true;
    popupContent.style.animation = "slideUp 0.3s ease-out";
    setTimeout(function () {
      popup.style.display = "none";
      isClosing = false;
    }, 300); // Duración de la animación de cierre
  }
}
function openModal(e=null){
    if(e) e.preventDefault();
    const popup = d.getElementById("contact-form-popup");
    const popupContent = d.querySelector(".popup-content");
    popup.style.display = "flex";
    popupContent.classList.remove("closing");
    popupContent.style.animation = "slideDown 0.3s ease-out";
    isClosing = false; // Resetear el estado de cierre
}
