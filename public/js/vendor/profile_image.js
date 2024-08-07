import { fetchRequest } from "./fetch_request.js";
import { createToast } from "./notification.js";

export function updateProfileImage(file) {
  const formData = new FormData();
  formData.append("image", file);

  fetchRequest({
    method: "PUT",
    url: `http://${location.hostname}/profile/image`,
    contentType: "multipart/form-data",
    credentials: "include",
    data: formData,
    async success(response) {
      if (response.ok) {
        const result = await response.json();
        const newImageUrl = `./assets/profile_img/${result.profile_img}`;
        updateImageElements(newImageUrl);
        createToast("success", "Success:", "Profile image updated successfully");
        
        // Actualizar la información en sessionStorage
        const credentials = JSON.parse(sessionStorage.getItem('credentials'));
        credentials.profile_img = result.profile_img;
        sessionStorage.setItem('credentials', JSON.stringify(credentials));
      } else {
        const errorData = await response.json();
        createToast("error", "Error:", errorData.response || "Failed to update profile image");
      }
    },
    async error(err) {
      console.error("Error updating profile image:", err);
      createToast("error", "Error", "Failed to update profile image");
    }
  });
}

function updateImageElements(newImageUrl) {
  const profileImage = document.getElementById("userProfileImage");
  const navbarImage = document.getElementById("navUserAvatar");
  
  if (profileImage) profileImage.src = newImageUrl;
  if (navbarImage) navbarImage.src = newImageUrl;
}