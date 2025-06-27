import { cargarDatos } from "./datos.js";
import { setupUI } from "./ui.js";
import { filtrarPalabras } from "./filtros.js";

document.addEventListener("DOMContentLoaded", () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/reo_es/service-worker.js')
      .then(reg => console.log("✅ Service Worker registrado:", reg.scope))
      .catch(err => console.error("❌ Error al registrar Service Worker:", err));
  }

  setupUI();
  cargarDatos();
});
