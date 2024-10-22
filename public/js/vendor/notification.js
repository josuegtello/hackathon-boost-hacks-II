const d = document;
const $notifications = d.querySelector(".notifications");
const toastDetails = {
    timer: 5000,
   success : {
        icon: 'fa-circle-check'
    },
    error: {
        icon: 'fa-circle-xmark'
    },
    info: {
        icon: 'fa-circle-info'
    }
}

// Función de los botones de la barra de notificaciones
export async function initializeToast() {
    const buttons = d.querySelectorAll(".buttons .btn");
    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.id;
            const title = btn.getAttribute('data-title');
            const text = btn.getAttribute('data-text');
            createToast(id, title, text);
        });
    });
}

export const removeToast = (toast) => {
    toast.classList.add("hide");
    if (toast.timeoutId) clearTimeout(toast.timeoutId);
    setTimeout(() => toast.remove(), 500);
}

export const createToast = (id, title = '', text = '') => {
    const { icon } = toastDetails[id];
    const toast = d.createElement("li");
    toast.className = `toast ${id}`;
    toast.innerHTML = `<div class="column">
                     <i class="fa-solid ${icon}"></i>
                     <span class="title">${title}</span>
                     <span class="text">${text}</span>
                  </div>
                  <i class="fa-solid fa-xmark"></i>`;
    
    // Add btn-close
    toast.querySelector('.fa-xmark').addEventListener('click', () => removeToast(toast));
    
    $notifications.appendChild(toast);
    toast.timeoutId = setTimeout(() => removeToast(toast), toastDetails.timer);

    //si ya esta registrado lo guardamos en su muro
    const data=sessionStorage.getItem('credentials');
    return {
        id,
        title,
        text,
    }
}
export const imgDevice=function(type){
    if(type=="CelestialSec Lock") return "./assets/img/ssem-icon.png";
    else return null;

}
// Notificasiones del menu, FALTA cambiar esta funcion para que agarre la notificion de la clase user que tenemos
export const addNotificationToMenu = function(notification,submenu=null){
    const {name,type,body}=notification;
    const imgURL=imgDevice(type);
    const message=body.message
    const notifyItem = d.createElement("div"),
          $notifyMenu =submenu ? submenu : d.querySelector(".notify-menu-container-item"); // Contenedor del menu de notificaciones
    notifyItem.className = "notify-item";
    notifyItem.innerHTML = `
        <figure class="notify-img">
            <img src="${imgURL || './assets/img/piloto2.png'}" alt="notify">
        </figure>
        <div class="notify-info">
            <p>${name} - ${message}</p>
        </div>
    `;
    
    // Insertar la nueva notificación al principio del contenedor
    $notifyMenu.insertBefore(notifyItem, $notifyMenu.firstChild);
}