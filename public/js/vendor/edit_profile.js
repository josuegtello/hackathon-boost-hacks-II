import { fetchRequest } from "./fetch_request.js";
import { createToast } from "./notification.js";
const d = document;

const startEdit=function(e){
  const $btn=e.target,
      mode=$btn.getAttribute("data-edit-mode");
  console.log($btn,mode);
  if(mode=="active"){ //significa que queremos desactivarlo, ponemos todos los valores que ya tenia
    $btn.setAttribute("data-edit-mode","desactive");
    $btn.classList.remove("container-edit-active");
    //FALTA regresar a los valores que ya tenia a la imagen
    const $inputs=d.querySelectorAll(".settings-tab-form input");
    const $btnSave=d.querySelector(".btn-edit-profile button");
    const $changePasswordBtn=d.querySelector(".link-change-password");
    const $imgBtn=d.querySelector(".profile-img-button");
    $inputs.forEach($input => {
      const oldValue=$input.getAttribute("data-old-value");
      $input.setAttribute("disabled","");
      $input.value=oldValue;
    });
    $btnSave.setAttribute("disabled","");
    $changePasswordBtn.classList.add("pointer-events-none","opacity-0");
    $imgBtn.classList.add("pointer-events-none","opacity-0");

  }
  else if(mode=="desactive"){
    $btn.setAttribute("data-edit-mode","active");
    $btn.classList.add("container-edit-active");
    const $inputs=d.querySelectorAll(".settings-tab-form input");
    const $btnSave=d.querySelector(".btn-edit-profile button");
    const $changePasswordBtn=d.querySelector(".link-change-password");
    const $imgBtn=d.querySelector(".profile-img-button");
    $inputs.forEach($input => {
      if($input.hasAttribute("disabled")){
        $input.removeAttribute("disabled");
      }
    });
    $btnSave.removeAttribute("disabled");
    $changePasswordBtn.classList.remove("pointer-events-none","opacity-0");
    $imgBtn.classList.remove("pointer-events-none","opacity-0");
  }
}
const closeModal=function() {
  const $newPassword = d.getElementById("new-password"),
        $confirmPassword = d.getElementById("confirm-password"),
        $modalPassword = d.getElementById("change-password-modal"),
        $changePasswordMessage=d.querySelector(".password-message"),
        $normalMessage=d.querySelector(".normal-message"),
        $inputsChangePassword=d.querySelectorAll(".change-password"),
        $changePasswordBtn=d.querySelector("#change-password-form  [type='submit']"),
        $verifyBtn=d.querySelector("#change-password-form [type='button']"),
        $input = d.querySelector("#old-password");
  $input.value = "";
  $newPassword.value = "";
  $confirmPassword.value = "";
  $modalPassword.style.display = "none";
  //poner aqui si lo que se presiono fue el boton de SAVE CHANGES o Change Password
  
  $normalMessage.classList.remove("display-none");
  $changePasswordMessage.classList.add("display-none");
  $inputsChangePassword.forEach($input => {
    $input.classList.add("display-none");
  });
  $changePasswordBtn.classList.add("display-none");
  $verifyBtn.classList.remove("display-none");


}
const setActiveTab=function(tabId) {
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
}
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
    const $changePasswordMessage=d.querySelector(".password-message"),
          $normalMessage=d.querySelector(".normal-message"),
          $inputsChangePassword=d.querySelectorAll(".change-password"),
          $changePasswordBtn=d.querySelector("#change-password-form  [type='submit']"),
          $verifyBtn=d.querySelector("#change-password-form [type='button']");
    
    $normalMessage.classList.add("display-none");
    $changePasswordMessage.classList.remove("display-none");
    $inputsChangePassword.forEach($input => {
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
      createToast("error", "Error", "Passwords do not match");
      return;
    }
    const password=d.getElementById("old-password").value.trim();

    if (!password || !newPassword) {
      createToast("error", "Error", "All fields are required");
      return;
    }

    const updatedData = { password:password, newPassword: newPassword };

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
          createToast("success", "Success", result.response);
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
        createToast("error", "Error", "Failed to change password");
      },
    });
  });
}

export function initializeEditProfile() {
  const $generalForm = d.getElementById("general-form");
  const $saveChangesBtn = d.getElementById("saveChangesBtn");
  const $btnModal=d.getElementById("openModal");
  const $modalPassword = d.getElementById("change-password-modal");
  const $startEditBtn=d.querySelector(".container-edit");
  //FALTA MANEJAR EL VENTO DEL INPUT PARA PONER LA IMAGEN AHI
  console.log($startEditBtn);
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
        let imgURL=null;
        if(profile_img){
          imgURL=`./assets/img/profile/${profile_img}`
        }
        d.getElementById("userProfileImage").src =
          imgURL || "./assets/img/user.jpg";
        d.getElementById("userProfileName").textContent = name;
        d.getElementById("usernameEdit").value = name;
        d.getElementById("emailEdit").value = email;
        d.getElementById("phoneEdit").value = phone || "";
        
        d.getElementById("usernameEdit").setAttribute("data-old-value",name);
        d.getElementById("emailEdit").setAttribute("data-old-value",email);
        d.getElementById("phoneEdit").setAttribute("data-old-value",phone || ""); 
      }
    },
    async error(err) {
      console.error("Error fetching user data:", err);
      createToast("error", "Error", "Could not load user data");
    },
  });

  // Actualizar el perfil
  $saveChangesBtn.addEventListener("click", function (e) {
    e.preventDefault();
    const name = d.getElementById("usernameEdit").value.trim();
    const email = d.getElementById("emailEdit").value.trim();
    const password = d.getElementById("old-password").value;
    const phone=d.getElementById("phoneEdit").value;
    if (!name || !email || !password) {
      createToast("error", "Error", "All fields are required");
      return;
    }
    const updatedData = { name, email, password,phone};
    console.log("Datos que se envían al servidor:", updatedData);

    fetchRequest({
      method: "PUT",
      url: `http://${location.hostname}/profile`,
      contentType: "application/json",
      credentials: "include",
      data: JSON.stringify(updatedData),
      async success(response) {
        if (response.ok) {
          const result = await response.json();
          createToast("success", "Success", result.response);
          const data = { name: name },
            $user = d.querySelector('[data-type="user"] > span'),
            $inputName=d.querySelector("#usernameEdit"),
            $inputEmail=d.querySelector("#emailEdit"),
            $inputPhone=d.querySelector("#phoneEdit");
          sessionStorage.setItem("credentials", JSON.stringify(data));
          $user.textContent = data.name;
          d.getElementById("userProfileName").textContent = name;
          $inputName.setAttribute("data-old-value",name);
          $inputEmail.setAttribute("data-old-value",email);
          $inputPhone.setAttribute("data-old-value",phone);
          //FALTA lo mas probable es que mande como respuesta la ruta de la imagen guardada si es que hiciste eso



        } else {
          const errorData = await response.json();
          createToast(
            "error",
            "Error",
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
  $startEditBtn.addEventListener("click",startEdit);
  $btnModal.addEventListener("click", function (e) {
    e.preventDefault();
    $modalPassword.style.display = "block";
  })
}




const newProfileImage=function(e){
  
  if($target==img){   //solo hacemos esto si el evento que lo provoco fue el del input file
    //insertamos las imagenes de el post detallado
    const imgDetail=img.cloneNode(true);
    $detailPost.querySelector('.post-images').innerHTML='';
    for (let i = 0; i < img.files.length; i++) {
        const file=imgDetail.files[i];
        const $img=d.createElement('img');
        if(i==0)$img.setAttribute('data-principal','');
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                $img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
        $detailPost.querySelector('.post-images').appendChild($img)
    }
    $post.querySelector('.post-images').innerHTML='';
    const file=imgDetail.files[0];
    const $img=d.createElement('img');
    $img.setAttribute('data-principal','');
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            $img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    $post.querySelector('.post-images').appendChild($img)
    console.log(img.files);
}
}
