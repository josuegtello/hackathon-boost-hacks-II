import { fetchRequest } from "./fetch_request.js";
import { createToast } from "./notification.js";
import { sleep } from "./sleep.js";
const d = document,
  body = d.body;

const startEdit = function (e) {
  const $btn = e.target,
    mode = $btn.getAttribute("data-edit-mode");
  console.log($btn, mode);
  if (mode == "active") {
    //significa que queremos desactivarlo, ponemos todos los valores que ya tenia
    $btn.setAttribute("data-edit-mode", "desactive");
    $btn.classList.remove("container-edit-active");
    //FALTA regresar a los valores que ya tenia a la imagen
    const $inputs = d.querySelectorAll(".settings-tab-form input");
    const $btnSave = d.querySelector(".btn-edit-profile button");
    const $changePasswordBtn = d.querySelector(".link-change-password");
    const $imgBtn = d.querySelector(".profile-img-button");
    $inputs.forEach(($input) => {
      const oldValue = $input.getAttribute("data-old-value");
      $input.setAttribute("disabled", "");
      $input.value = oldValue;
    });
    $btnSave.setAttribute("disabled", "");
    $changePasswordBtn.classList.add("pointer-events-none", "opacity-0");
    $imgBtn.classList.add("pointer-events-none", "opacity-0");
    const $newInput = d.createElement("input"),
      $img = d.querySelector("#userProfileImage"),
      src = $img.getAttribute("data-old-value"),
      $inputFile = d.querySelector(".profile-input-file");
    $newInput.setAttribute("id", "file");
    $newInput.setAttribute("name", "input_file");
    $newInput.setAttribute("type", "file");
    $newInput.setAttribute("accept", "image/*");
    $newInput.classList.add("profile-input-file");
    $inputFile.replaceWith($newInput);
    $img.setAttribute("src", src);
    $newInput.addEventListener("change", newProfileImage);
  } else if (mode == "desactive") {
    $btn.setAttribute("data-edit-mode", "active");
    $btn.classList.add("container-edit-active");
    const $inputs = d.querySelectorAll(".settings-tab-form input");
    const $btnSave = d.querySelector(".btn-edit-profile button");
    const $changePasswordBtn = d.querySelector(".link-change-password");
    const $imgBtn = d.querySelector(".profile-img-button");
    $inputs.forEach(($input) => {
      if ($input.hasAttribute("disabled")) {
        $input.removeAttribute("disabled");
      }
    });
    $btnSave.removeAttribute("disabled");
    $changePasswordBtn.classList.remove("pointer-events-none", "opacity-0");
    $imgBtn.classList.remove("pointer-events-none", "opacity-0");
  }
};
const closeModal = function () {
  const $newPassword = d.getElementById("new-password"),
    $confirmPassword = d.getElementById("confirm-password"),
    $modalPassword = d.getElementById("change-password-modal"),
    $changePasswordMessage = d.querySelector(".password-message"),
    $normalMessage = d.querySelector(".normal-message"),
    $inputsChangePassword = d.querySelectorAll(".change-password"),
    $changePasswordBtn = d.querySelector(
      "#change-password-form  [type='submit']"
    ),
    $verifyBtn = d.querySelector("#change-password-form [type='button']"),
    $input = d.querySelector("#old-password");
  $input.value = "";
  $newPassword.value = "";
  $confirmPassword.value = "";
  $modalPassword.style.display = "none";
  //poner aqui si lo que se presiono fue el boton de SAVE CHANGES o Change Password

  $normalMessage.classList.remove("display-none");
  $changePasswordMessage.classList.add("display-none");
  $inputsChangePassword.forEach(($input) => {
    $input.classList.add("display-none");
  });
  $changePasswordBtn.classList.add("display-none");
  $verifyBtn.classList.remove("display-none");
};
const setActiveTab = function (tabId) {
  const $tabs = d.querySelectorAll(".edit-profile-nav li");
  const $tabContents = d.querySelectorAll(".settings-tab");
  // Se ocultan todos los tabs
  $tabContents.forEach((content) => {
    content.classList.remove("edit-profile-active");
    content.classList.add("display-none");
  });

  // Se desactivan todos botones
  $tabs.forEach((tab) => tab.classList.remove("edit-profile-active"));

  // Se activa el tab seleccionado
  const activeTab = d.querySelector(`[data-tab="${tabId}"]`);
  const activeContent = d.getElementById(tabId);

  if (activeTab && activeContent) {
    activeTab.classList.add("edit-profile-active");

    // Se hace visible el contenido del tab antes de añadir la clase 'active'
    activeContent.classList.remove("display-none");

    // Para asegurar que el cambio de display se ha aplicado
    setTimeout(() => {
      activeContent.classList.add("edit-profile-active");
    }, 10);
  }
};
const deleteAccount = function (e) {
  e.preventDefault();
  const password = d.getElementById("delete-password").value.trim();
  if (!password) {
    createToast("error", "Error", "Password are required");
    return;
  }
  const data = { password };
  console.log("Datos que se envían al servidor:", data);
  fetchRequest({
    method: "DELETE",
    url: `http://${location.hostname}/profile`,
    contentType: "application/json",
    credentials: "include",
    data: JSON.stringify(data),
    async success(response) {
      if (response.ok) {
        const result = await response.json();
        body.classList.add("pointer-events-none");
        createToast("success", "Success:", result.response);
        sessionStorage.removeItem("credentials");
        await sleep(3000);
        location.reload();
      } else {
        const errorData = await response.json();
        createToast(
          "error",
          "Error:",
          errorData.response || "Failed to delete profile"
        );
      }
    },
    async error(err) {
      console.error("Error updating profile:", err);
      createToast("error", "Error:", "Failed to delete profile");
    },
  });
};
export function initializeTabs() {
  const $tabs = d.querySelectorAll(".edit-profile-nav li");
  $tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      const target = this.getAttribute("data-tab");
      setActiveTab(target);
    });
  });

  // Activar el primer tab por defecto
  if ($tabs.length > 0) {
    const firstTabId = $tabs[0].getAttribute("data-tab");
    setActiveTab(firstTabId);
  }
}

export function initializeChangePassword() {
  const $changePasswordLink = d.querySelector(".link-change-password a");
  const $modalPassword = d.getElementById("change-password-modal");
  const $changePasswordForm = d.getElementById("change-password-form");
  const $closeModalPassword = d.querySelector(".close-modal-password");
  $changePasswordLink.addEventListener("click", function (e) {
    e.preventDefault();
    $modalPassword.style.display = "block";
    const $changePasswordMessage = d.querySelector(".password-message"),
      $normalMessage = d.querySelector(".normal-message"),
      $inputsChangePassword = d.querySelectorAll(".change-password"),
      $changePasswordBtn = d.querySelector(
        "#change-password-form  [type='submit']"
      ),
      $verifyBtn = d.querySelector("#change-password-form [type='button']");

    $normalMessage.classList.add("display-none");
    $changePasswordMessage.classList.remove("display-none");
    $inputsChangePassword.forEach(($input) => {
      $input.classList.remove("display-none");
    });
    $changePasswordBtn.classList.remove("display-none");
    $verifyBtn.classList.add("display-none");
  });

  $closeModalPassword.addEventListener("click", closeModal);

  window.addEventListener("click", function (e) {
    if (e.target === $modalPassword) {
      closeModal();
    }
  });

  //Cambiar contraseña
  $changePasswordForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const newPassword = d.getElementById("new-password").value;
    const confirmPassword = d.getElementById("confirm-password").value;

    if (newPassword !== confirmPassword) {
      createToast("error", "Error:", "Passwords do not match");
      return;
    }
    const password = d.getElementById("old-password").value.trim();

    if (!password || !newPassword) {
      createToast("error", "Error:", "All fields are required");
      return;
    }

    const updatedData = { password: password, newPassword: newPassword };

    console.log(
      "Datos que se envían al servidor para cambio de contraseña:",
      updatedData
    );

    fetchRequest({
      method: "PUT",
      url: `http://${location.hostname}/profile/password`,
      contentType: "application/json",
      credentials: "include",
      data: JSON.stringify(updatedData),
      async success(response) {
        if (response.ok) {
          const result = await response.json();
          createToast("success", "Success:", result.response);
          closeModal();
        } else {
          const errorData = await response.json();
          createToast(
            "error",
            "Error",
            errorData.response || "Failed to change password"
          );
        }
      },
      async error(err) {
        console.error("Error changing password:", err);
        createToast("error", "Error:", "Failed to change password");
      },
    });
  });
}

export function initializeEditProfile() {
  const $saveChangesBtn = d.getElementById("saveChangesBtn");
  const $btnModal = d.getElementById("openModal");
  const $modalPassword = d.getElementById("change-password-modal");
  const $startEditBtn = d.querySelector(".container-edit");
  const $deleteAccoutnBtn = d.querySelector("#deteleBtn");
  const $inputFile = d.querySelector(".profile-input-file");
  //FALTA MANEJAR EL VENTO DEL INPUT PARA PONER LA IMAGEN AHI
  console.log($startEditBtn, $deleteAccoutnBtn);
  // Cargar datos del usuario
  fetchRequest({
    method: "GET",
    url: `http://${location.hostname}/profile`,
    contentType: "application/json",
    credentials: "include",
    async success(response) {
      if (response.ok) {
        const userData = await response.json();
        const { name, email, phone, profile_img } = userData.credentials;
        let imgURL = null;
        if (profile_img) {
          imgURL = `./assets/profile_img/${profile_img}`;
        }
        d.getElementById("userProfileImage").src =
          imgURL || "./assets/img/user.jpg";
        d.getElementById("userProfileName").textContent = name;
        d.getElementById("usernameEdit").value = name;
        d.getElementById("emailEdit").value = email;
        d.getElementById("phoneEdit").value = phone || "";
        d.getElementById("userProfileImage").setAttribute(
          "data-old-value",
          imgURL || "./assets/img/user.jpg"
        );
        d.getElementById("usernameEdit").setAttribute("data-old-value", name);
        d.getElementById("emailEdit").setAttribute("data-old-value", email);
        d.getElementById("phoneEdit").setAttribute(
          "data-old-value",
          phone || ""
        );
      }
    },
    async error(err) {
      console.error("Error fetching user data:", err);
      createToast("error", "Error:", "Could not load user data");
    },
  });

  // Actualizar el perfil
  $saveChangesBtn.addEventListener("click", function (e) {
    e.preventDefault();
    const name = d.getElementById("usernameEdit").value.trim();
    const email = d.getElementById("emailEdit").value.trim();
    const password = d.getElementById("old-password").value;
    const phone = d.getElementById("phoneEdit").value;
    const file = d.querySelector("#file").files[0];
    if (!name || !email || !password) {
      createToast("error", "Error:", "All fields are required");
      return;
    }
    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("phone", phone);
    if (file) {
      formData.append("image", file);
    }
    console.log("Datos que se envían al servidor:", formData);
    fetchRequest({
      method: "PUT",
      url: `http://${location.hostname}/profile`,
      contentType: "multipart/form-data",
      credentials: "include",
      data: formData,
      async success(response) {
        if (response.ok) {
          const result = await response.json();
          console.log("respuesta exitosa",result);
          createToast("success", "Success:", result.response);
          const data = { name: name },
            $user = d.querySelector('[data-type="user"] > span'),
            $inputName = d.querySelector("#usernameEdit"),
            $inputEmail = d.querySelector("#emailEdit"),
            $inputPhone = d.querySelector("#phoneEdit");
          $user.textContent = data.name;
          d.getElementById("userProfileName").textContent = name;
          $inputName.setAttribute("data-old-value", name);
          $inputEmail.setAttribute("data-old-value", email);
          $inputPhone.setAttribute("data-old-value", phone);
          if (result.profile_img) {
            // FALTA en vex de hacer todo el cambio fisico mejor recargo la pagina para que aprezca aqui mismo again
            //si existe significa que hay nueva imagen guardada para perfil
            data.profile_img = result.profile_img;
            const $img=d.getElementById("userProfileImage"),
              $inputFile = d.querySelector(".profile-input-file"),
              $newInput = $inputFile.cloneNode(false),
              timestamp = new Date().getTime(); // Obtiene el tiempo actual en milisegundos
            $img.src=`${result.profile_img}?timestamp=${timestamp}`;
            $img.setAttribute("data-old-value",`${result.profile_img}?timestamp=${timestamp}`);
            $inputFile.replaceWith($newInput);
            $newInput.addEventListener("change", newProfileImage);
          }
          sessionStorage.setItem("credentials", JSON.stringify(data));
        } else {
          const errorData = await response.json();
          createToast(
            "error",
            "Error:",
            errorData.response || "Failed to update profile"
          );
        }
      },
      async error(err) {
        console.error("Error updating profile:", err);
        createToast("error", "Error", "Failed to update profile");
      },
    });
    closeModal();
  });
  $startEditBtn.addEventListener("click", startEdit);
  $btnModal.addEventListener("click", function (e) {
    e.preventDefault();
    $modalPassword.style.display = "block";
  });
  $deleteAccoutnBtn.addEventListener("click", deleteAccount);
  $inputFile.addEventListener("change", newProfileImage);
}

const newProfileImage = function (e) {
  const $input = e.target;
  const file = $input.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const $img = d.getElementById("userProfileImage");
      $img.src = e.target.result;
      $img.style.display = "block";
    };
    reader.readAsDataURL(file);
  }
};
