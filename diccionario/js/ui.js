// ui.js
import { filtrarPalabras } from "./filtros.js";

export function setupUI() {
  const buscador = document.getElementById("buscador");
  if (buscador) {
    buscador.addEventListener("input", filtrarPalabras);
  }

  const filtros = document.getElementById("filtros");
  if (filtros) {
    filtros.addEventListener("change", filtrarPalabras);
  }
}
