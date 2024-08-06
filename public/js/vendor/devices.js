const d = document;

export function initializeDevices() {
    initializeTabs();
    initializeDeviceSection();
    initializeDashboard();
    initializeCardModal();
    initializePasswordModal();
    initializeAddDeviceForm();
}

// Sección de Tabs
function initializeTabs() {
    const $tabs = d.querySelectorAll('.devices-nav li');
    const $tabContents = d.querySelectorAll('.devices-tab');

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

    function setActiveTab(tabId) {
        $tabContents.forEach(content => content.classList.remove('devices-active'));
        $tabs.forEach(tab => tab.classList.remove('devices-active'));

        const activeTab = d.querySelector(`[data-tab="${tabId}"]`);
        const activeContent = d.getElementById(tabId);

        if (activeTab && activeContent) {
            activeTab.classList.add('devices-active');
            activeContent.classList.add('devices-active');
        }
    }
}

// Sección de Devices
function initializeDeviceSection() {
    const $devices = d.querySelectorAll('.device-n');

    $devices.forEach($device => {
        const $input = $device.querySelector('input[type="text"]');
        const $editIcon = $device.querySelector('.fa-pencil-alt');
        const $deleteIcon = $device.querySelector('.fa-trash-alt');

        $input.setAttribute('data-original-value', $input.value);

        $editIcon.addEventListener('click', handleEditClick);
        $deleteIcon.addEventListener('click', handleDeleteClick);
        $input.addEventListener('keydown', handleInputKeydown);
    });
}

function handleEditClick(event) {
    const $element = event.target.closest('.device-n, .card-info');
    if ($element) {
        const $input = $element.querySelector('input[type="text"]');
        const $editIcon = event.target;
        
        if ($input.disabled) {
            $input.disabled = false;
            $input.focus();
            $editIcon.classList.add('editing');
        } else {
            $input.disabled = true;
            $editIcon.classList.remove('editing');
            $input.value = $input.getAttribute('data-original-value');
        }
    }
}

function handleDeleteClick(event) {
    const $element = event.target.closest('.device-n, .card-info');
    if ($element && confirm('¿Estás seguro de que quieres eliminar este elemento?')) {
        $element.remove();
        if ($element.classList.contains('card-info')) {
            updateSaveChangesButtonVisibility();
        }
    }
}

function handleInputKeydown(e) {
    if (e.key === 'Enter') {
        saveInputChanges(this);
    } else if (e.key === 'Escape') {
        cancelInputEdit(this);
    }
}

function saveInputChanges($input) {
    $input.disabled = true;
    $input.parentElement.querySelector('.fa-pencil-alt').classList.remove('editing');

    if ($input.value !== $input.getAttribute('data-original-value')) {
        console.log(`Nuevo valor guardado: ${$input.value}`);
        $input.setAttribute('data-original-value', $input.value);
    }
}

function cancelInputEdit($input) {
    $input.value = $input.getAttribute('data-original-value');
    $input.disabled = true;
    $input.parentElement.querySelector('.fa-pencil-alt').classList.remove('editing');
}

// Sección del Dashboard
function initializeDashboard() {
    const $dashboardButtons = d.querySelectorAll('.btn-dashboard');

    $dashboardButtons.forEach($button => {
        $button.addEventListener('click', handleDashboardButtonClick);
    });
}

function handleDashboardButtonClick() {
    const $icon = this.querySelector('i');
    const buttonText = this.querySelector('h4').textContent.trim().toLowerCase();

    if (buttonText === 'alarm' || buttonText === 'gate lock') {
        this.classList.toggle('active');

        if (buttonText === 'gate lock') {
            $icon.classList.toggle('fa-lock');
            $icon.classList.toggle('fa-lock-open');
        }
    } else if (buttonText === 'password') {
        showPasswordTemporarily(this);
    }
}

function showPasswordTemporarily($button) {
    const $passwordSpan = $button.querySelector('.see-password-dashboard');
    $passwordSpan.style.display = 'block';
    setTimeout(() => {
        $passwordSpan.style.display = 'none';
    }, 3000);
}

// Modal de tarjetas
function initializeCardModal() {
    const $openCardsModal = d.getElementById('open-cards-modal');
    const $cardsModal = d.getElementById('cards-modal');
    const $closeModalBtn = d.querySelector('.close-modal-cards');
    const $saveChangesBtn = d.getElementById('btn-save-change-cards');
    const $addCardBtn = d.querySelector('.add-card');
    const $changeCardsForm = d.getElementById('change-cards-form');

    if ($openCardsModal && $cardsModal) {
        $openCardsModal.addEventListener('click', openCardModal);
    }

    if ($closeModalBtn) {
        $closeModalBtn.addEventListener('click', closeCardModal);
    }

    if ($saveChangesBtn) {
        $saveChangesBtn.addEventListener('click', saveCardChanges);
    }

    if ($addCardBtn) {
        $addCardBtn.addEventListener('click', addNewCard);
    }

    window.addEventListener('click', closeModalOnOutsideClick);

    updateCardListeners();
}

function openCardModal(e) {
    e.preventDefault();
    d.getElementById('cards-modal').style.display = 'block';
    updateCardListeners();
}

function closeCardModal() {
    d.getElementById('cards-modal').style.display = 'none';
}

function saveCardChanges() {
    console.log('Cambios guardados');
    closeCardModal();
}

function addNewCard() {
    const $changeCardsForm = d.getElementById('change-cards-form');
    if ($changeCardsForm) {
        const newCardHTML = createNewCardHTML(cardCounter);
        $changeCardsForm.insertAdjacentHTML('afterbegin', newCardHTML);
        cardCounter++;
        updateCardListeners();
    }
}

let cardCounter = 0;

function createNewCardHTML(cardNumber) {
    return `
    <div class="card-info">
        <button type="button" aria-label="New card">
            <i class="fa-solid fa-address-card"></i>
        </button>
        <label for="nameCard-${cardNumber}">Name:</label>
        <input id="nameCard-${cardNumber}" type="text" placeholder="Card Name" disabled>
        <i class="fas fa-pencil-alt edit-icon-card"></i>
        <i class="fas fa-trash-alt"></i>
    </div>
    `;
}

function closeModalOnOutsideClick(e) {
    if (e.target === d.getElementById('cards-modal')) {
        closeCardModal();
    }
}

function updateCardListeners() {
    const $editIcons = d.querySelectorAll('.edit-icon-card, .fa-pencil-alt');
    const $deleteIcons = d.querySelectorAll('.fa-trash-alt');

    $editIcons.forEach($icon => {
        $icon.removeEventListener('click', handleEditClick);
        $icon.addEventListener('click', handleEditClick);
    });

    $deleteIcons.forEach($icon => {
        $icon.removeEventListener('click', handleDeleteClick);
        $icon.addEventListener('click', handleDeleteClick);
    });

    updateSaveChangesButtonVisibility();
}

function updateSaveChangesButtonVisibility() {
    const $changeCardsForm = d.getElementById('change-cards-form');
    const $saveChangesBtn = d.getElementById('btn-save-change-cards');
    const hasCards = $changeCardsForm.querySelector('.card-info') !== null;
    $saveChangesBtn.style.display = hasCards ? 'block' : 'none';
}

// Modal Change Password
function initializePasswordModal() {
    const $openChangePasswordModal = d.getElementById('open-change-password-modal');
    const $modalChangePassword = d.getElementById('modal-change-password-device');
    const $modalContent = d.querySelector('.modal-change-password-content');
    const $closeModalPasswordBtn = d.querySelector('.close-modal-password-device');
    const $savePasswordBtn = d.getElementById('btn-save-password-device');

    if ($openChangePasswordModal && $modalChangePassword) {
        $openChangePasswordModal.addEventListener('click', openPasswordModal);
    }

    if ($closeModalPasswordBtn) {
        $closeModalPasswordBtn.addEventListener('click', closePasswordModal);
    }

    if ($savePasswordBtn) {
        $savePasswordBtn.addEventListener('click', saveNewPassword);
    }

    window.addEventListener('click', closePasswordModalOnOutsideClick);

    if ($modalContent) {
        $modalContent.addEventListener('click', stopPropagation);
    }
}

function openPasswordModal() {
    d.getElementById('modal-change-password-device').style.display = 'block';
}

function closePasswordModal() {
    d.getElementById('modal-change-password-device').style.display = 'none';
}

function saveNewPassword() {
    console.log('Nueva contraseña guardada');
    closePasswordModal();
}

function closePasswordModalOnOutsideClick(e) {
    if (e.target === d.getElementById('modal-change-password-device')) {
        closePasswordModal();
    }
}

function stopPropagation(e) {
    e.stopPropagation();
}

// Sección de Add Device
function initializeAddDeviceForm() {
    const $openFormAddCard = d.getElementById('open-form-add-card');
    const $addCardForm = d.getElementById('add-card-form');

    if ($openFormAddCard && $addCardForm) {
        $openFormAddCard.addEventListener('click', toggleAddCardForm);
    }

    const $tabs = d.querySelectorAll('.devices-nav li');
    $tabs.forEach(tab => {
        tab.addEventListener('click', closeAddCardForm);
    });

    window.addEventListener('beforeunload', closeAddCardForm);
}

function toggleAddCardForm(e) {
    e.preventDefault();
    const $addCardForm = d.getElementById('add-card-form');
    const $icon = this.querySelector('i');
    const isHidden = $addCardForm.style.display === 'none';
    
    $addCardForm.style.display = isHidden ? 'flex' : 'none';
    $icon.classList.toggle('fa-caret-down', !isHidden);
    $icon.classList.toggle('fa-caret-up', isHidden);
}

function closeAddCardForm() {
    const $addCardForm = d.getElementById('add-card-form');
    const $openFormAddCard = d.getElementById('open-form-add-card');
    
    if ($addCardForm) {
        $addCardForm.style.display = 'none';
        const $icon = $openFormAddCard.querySelector('i');
        $icon.classList.remove('fa-caret-up');
        $icon.classList.add('fa-caret-down');
    }
}