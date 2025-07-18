// main.js
import { cargarDatos } from "./datos.js";
import { setupUI } from "./ui.js";
import { setupMenu } from "./menu.js";

document.addEventListener("DOMContentLoaded", () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/reo_es/service-worker.js')
      .then(reg => console.log("✅ Service Worker registrado:", reg.scope))
      .catch(err => console.error("❌ Error al registrar Service Worker:", err));
  }

  setupMenu();
  setupUI();
 // ✅ Solo cargar CSV si existe el contenedor de resultados
  if (document.getElementById("resultados")) {
    cargarDatos();
  }
  
});
