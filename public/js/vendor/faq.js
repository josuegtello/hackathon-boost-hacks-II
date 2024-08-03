const d = document;
export function faq(){
  const buttons = d.querySelectorAll(".more-btn");
  
    buttons.forEach((button) => {
      button.innerHTML = '<i class="fas fa-plus"></i>';
      button.addEventListener("click", (e) => {
        const answer = e.target.closest(".faq-item").querySelector(".answer");
        if (answer.style.display === "block") {
          answer.style.display = "none";
          button.innerHTML = '<i class="fas fa-plus"></i>';
        } else {
          answer.style.display = "block";
          button.innerHTML = '<i class="fas fa-minus"></i>';
        }
      });
    });
}
