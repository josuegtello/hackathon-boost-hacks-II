import { fetchRequest } from './fetch_request.js';
import { createToast } from "./notification.js";
const d = document;
export function initializeTabs() {
  const $tabs = d.querySelectorAll('.edit-profile-nav li');
  const $tabContents = d.querySelectorAll('.settings-tab');

  function setActiveTab(tabId) {
    // Se ocultan todos los tabs
    $tabContents.forEach(content => {
      content.classList.remove('edit-profile-active');
      content.style.display = 'none';
    });

    // Se desactivan todos botones
    $tabs.forEach(tab => tab.classList.remove('edit-profile-active'));

    // Se activa el tab seleccionado
    const activeTab = document.querySelector(`[data-tab="${tabId}"]`);
    const activeContent = document.getElementById(tabId);

    if (activeTab && activeContent) {
      activeTab.classList.add('edit-profile-active');

      // Se hace visible el contenido del tab antes de añadir la clase 'active'
      activeContent.style.display = 'block';

      // Para asegurar que el cambio de display se ha aplicado
      setTimeout(() => {
        activeContent.classList.add('edit-profile-active');
      }, 10);
    }
  }

  $tabs.forEach(tab => {
    tab.addEventListener('click', function () {
      const target = this.getAttribute('data-tab');
      setActiveTab(target);
    });
  });

  // Activar el primer tab por defecto
  if ($tabs.length > 0) {
    const firstTabId = $tabs[0].getAttribute('data-tab');
    setActiveTab(firstTabId);
  }
}

export function initializeChangePassword() {
  const $changePasswordLink = d.querySelector('.link-change-password a');
  const $modalPassword = d.getElementById('change-password-modal');
  const $changePasswordForm = d.getElementById('change-password-form');
  const $closeModalPassword = d.querySelector('.close-modal-password');

  function closeModal() {
    const $newPassword = d.getElementById('new-password');
    const $confirmPassword = d.getElementById('confirm-password');
    $newPassword.value="";
    $confirmPassword.value="";
    $modalPassword.style.display = 'none';
  }

  $changePasswordLink.addEventListener('click', function (e) {
    e.preventDefault();
    $modalPassword.style.display = 'block';
  });

  $closeModalPassword.addEventListener('click', closeModal);

  window.addEventListener('click', function (e) {
    if (e.target === $modalPassword) {
      closeModal();
    }
  });

  //Cambiar contraseña
  $changePasswordForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const newPassword = d.getElementById('new-password').value;
    const confirmPassword = d.getElementById('confirm-password').value;

    if (newPassword !== confirmPassword) {
      createToast('error', 'Error', 'Passwords do not match');
      return;
    }

    const name = d.getElementById('usernameEdit').value.trim();
    const email = d.getElementById('emailEdit').value.trim();

    if (!name || !email || !newPassword) {
      createToast('error', 'Error', 'All fields are required');
      return;
    }

    const updatedData = { name, email, password: newPassword };

    console.log('Datos que se envían al servidor para cambio de contraseña:', updatedData);

    fetchRequest({
      method: 'PUT',
      url: `http://${location.hostname}/profile`,
      contentType: 'application/json',
      credentials: 'include',
      data: JSON.stringify(updatedData),
      async success(response) {
        if (response.ok) {
          const result = await response.json();
          createToast('success', 'Success', result.response);
          const $input=d.querySelector("#old-password");
          $input.value=newPassword;
          closeModal();
        } else {
          const errorData = await response.json();
          createToast('error', 'Error', errorData.response || 'Failed to change password');
        }
      },
      async error(err) {
        console.error('Error changing password:', err);
        createToast('error', 'Error', 'Failed to change password');
      }
    });
  });
}

export function initializeEditProfile() {
  const $generalForm = d.getElementById('general-form');
  const $saveChangesBtn = d.getElementById('saveChangesBtn');
  
  // Cargar datos del usuario
  fetchRequest({
    method: 'GET',
    url: `http://${location.hostname}/profile`,
    contentType: 'application/json',
    credentials: 'include',
    async success(response) {
      if (response.ok) {
        const userData = await response.json();
        const {name,password,email,phone,imageUrl}=userData.credentials
        d.getElementById('userProfileImage').src = imageUrl || './assets/img/user.jpg';
        d.getElementById('userProfileName').textContent = name;
        d.getElementById('usernameEdit').value = name;
        d.getElementById('emailEdit').value = email;
        d.getElementById('old-password').value = password;
        d.getElementById('phoneEdit').value = phone || '';
        console.log(credentials);
      }
    },
    async error(err) {
      console.error('Error fetching user data:', err);
      createToast('error', 'Error', 'Could not load user data');
    }
  });

  // Actualizar el perfil
  $saveChangesBtn.addEventListener('click', function(e) {
    e.preventDefault();
    const name = d.getElementById('usernameEdit').value.trim();
    const email = d.getElementById('emailEdit').value.trim();
    const password = d.getElementById('old-password').value;

    if (!name || !email || !password) {
      createToast('error', 'Error', 'All fields are required');
      return;
    }

    const updatedData = { name, email, password };

    console.log('Datos que se envían al servidor:', updatedData);

    fetchRequest({
      method: 'PUT',
      url: `http://${location.hostname}/profile`,
      contentType: 'application/json',
      credentials: 'include',
      data: JSON.stringify(updatedData),
      async success(response) {
        if (response.ok) {
          const result = await response.json();
          createToast('success', 'Success', result.response);
          const data={name:name},
               $user = d.querySelector('[data-type="user"] > span');
          sessionStorage.setItem('credentials',JSON.stringify(data));
          $user.textContent = data.name;
          d.getElementById('userProfileName').textContent = name;
        } else {
          const errorData = await response.json();
          createToast('error', 'Error', errorData.response || 'Failed to update profile');
        }
      },
      async error(err) {
        console.error('Error updating profile:', err);
        createToast('error', 'Error', 'Failed to update profile');
      }
    });
  });
}