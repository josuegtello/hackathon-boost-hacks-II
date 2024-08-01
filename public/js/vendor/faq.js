const d = document;
import {sleep} from "./sleep.js";
export function faq(){
  const buttons = d.querySelectorAll(".more-btn");
  
    buttons.forEach((button) => {
      button.innerHTML = '<i class="fas fa-plus"></i>';
      button.addEventListener("click", async (e) => {
        const answer = e.target.closest(".faq-item").querySelector(".answer");
        if (answer.classList.contains("answer-hidden")) {
          answer.classList.remove("answer-hidden")
          button.innerHTML = '<i class="fas fa-plus"></i>';
          await sleep(305);
          answer.style.display = "none";
          

        } else {
          answer.style.display = "block";
          await sleep(2);
          button.innerHTML = '<i class="fas fa-minus"></i>';
          answer.classList.add("answer-hidden")
        }
      });
    });
}
