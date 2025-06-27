// ui.js
import { filtrarPalabras } from "./filtros.js";
import { mostrarPalabraDelDiaManual } from "./palabra-dia.js";

export function setupUI() {
  const buscador = document.getElementById("buscador");

  if (buscador) {
    buscador.addEventListener("input", filtrarPalabras);

    // 👉 Agrega botón Palabra del Día
    const btnDia = document.createElement("button");
    btnDia.textContent = "📅";
    btnDia.title = "Palabra del Día";
    btnDia.className = "btn-palabra-dia";
    btnDia.onclick = () => mostrarPalabraDelDiaManual();

    buscador.parentElement.insertBefore(btnDia, buscador.nextSibling);
  }
  
  const filtros = document.getElementById("filtros");
  if (filtros) {
    filtros.addEventListener("change", filtrarPalabras);
  }
}
