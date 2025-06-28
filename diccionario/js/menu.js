// menu.js
export function setupMenu() {
  const toggles = document.querySelectorAll("#menu-toggle");
  const menu = document.getElementById("menu");
  const close = document.getElementById("menu-close");

  toggles.forEach(toggle => {
    toggle.addEventListener("click", () => {
      menu.classList.add("activo");
      document.body.classList.add("menu-abierto");
    });
  });

  if (close) {
    close.addEventListener("click", () => {
      menu.classList.remove("activo");
      document.body.classList.remove("menu-abierto");
    });
    
  }
}
