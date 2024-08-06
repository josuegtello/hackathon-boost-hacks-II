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
    if(data){
        // Añadir la notificacion al menu
        //addNotificationToMenu(id, title, text);
    }
}

// Notificasiones del menu
const addNotificationToMenu = (title, text, imageUrl) => {
    const notifyItem = d.createElement("div"),
          $notifyMenu = d.querySelector(".notify-items"); // Contenedor del menu de notificaciones
    notifyItem.className = "notify-item";
    notifyItem.innerHTML = `
        <figure class="notify-img">
            <img src="${imageUrl || './assets/img/piloto2.png'}" alt="notify">
        </figure>
        <div class="notify-info">
            <p>${title} - ${text}</p>
        </div>
    `;
    $notifyMenu.appendChild(notifyItem);
}