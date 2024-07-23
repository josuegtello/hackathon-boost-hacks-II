const d=document;
const cursor = d.querySelector('.cursor');
let mouseX = 0,
    mouseY = 0;
export const startCursor=async function(){
    gsap.to({}, 0.016, {
        repeat: -1,
        onRepeat: function () {
            gsap.set(cursor, {
                css: {
                    left: mouseX,
                    top: mouseY
                }
            })
        }
    });
    console.log(cursor);
    window.addEventListener("mousemove", function (e) {
        mouseX = e.clientX;
        mouseY = e.clientY
    });
}
export const startLinks=async function(){
    const cursorScale = d.querySelectorAll('.cursor-scale');
    cursorScale.forEach(link => {
        link.addEventListener('mouseleave', () => {
            cursor.classList.remove('grow');
            cursor.classList.remove('grow-small');
        });
        link.addEventListener('mousemove', () => {
            cursor.classList.add('grow');
            if(link.classList.contains('small')){
               // const cursor = d.querySelector('.cursor');
                cursor.classList.remove('grow');
                cursor.classList.add('grow-small');
            }
        });
    });
}