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

  $changePasswordForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const newPassword = d.getElementById('new-password').value;
    const confirmPassword = d.getElementById('confirm-password').value;

    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    console.log('Password changed successfully');
    closeModal();
  });
}