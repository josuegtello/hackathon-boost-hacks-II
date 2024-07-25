const d = document;
const notifications = d.querySelector(".notifications");
const toastDetails = {
    timer: 5000,
    success: {
        icon: 'fa-circle-check',
        title: 'Success: ',
        text: ' This is a success toast.',
    },
    error: {
        icon: 'fa-circle-xmark',
        title: 'Error: ',
        text: ' This is an error toast.',
    },
    info: {
        icon: 'fa-circle-info',
        title: 'Info: ',
        text: ' This is an information toast.',
    }
}


export async function initializeToast() {
    const buttons = d.querySelectorAll(".buttons .btn");
    buttons.forEach(btn => {
        btn.addEventListener("click", () => createToast(btn.id));
    });

}

const removeToast = (toast) => {
    toast.classList.add("hide");
    if (toast.timeoutId) clearTimeout(toast.timeoutId);
    setTimeout(() => toast.remove(), 500);
}

const createToast = (id) => {
    const { icon, title, text } = toastDetails[id];
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
    
    notifications.appendChild(toast);
    toast.timeoutId = setTimeout(() => removeToast(toast), toastDetails.timer);
}

