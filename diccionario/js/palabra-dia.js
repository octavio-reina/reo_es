// palabra-dia.js
import { palabras } from "./datos.js";
import { mostrarPalabras } from "./tarjeta.js";

const STORAGE_KEY = "palabraDelDia";

export function inicializarPalabraDelDia() {
  const hoy = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  const guardado = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");

  let palabra;

  if (guardado.fecha === hoy) {
    palabra = palabras.find(p => p["Reo Tahiti"] === guardado.reo);
  } else {
    palabra = seleccionarPalabraAleatoria();
    if (palabra) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        fecha: hoy,
        reo: palabra["Reo Tahiti"]
      }));
    }
  }

  if (palabra) {
    mostrarTarjetaFlotante(palabra);
  }
}

function seleccionarPalabraAleatoria() {
  if (!palabras || palabras.length === 0) return null;
  const candidatas = palabras.filter(p => p["Reo Tahiti"] && p["Español"]);
  const i = Math.floor(Math.random() * candidatas.length);
  return candidatas[i];
}

function mostrarTarjetaFlotante(palabra) {
  const contenedor = document.createElement("div");
  contenedor.id = "tarjeta-dia";
  contenedor.className = "tarjeta-flotante";

  const cerrar = document.createElement("button");
  cerrar.className = "cerrar-tarjeta-dia";
  cerrar.innerHTML = "✖️";
  cerrar.onclick = () => contenedor.remove();

  const titulo = document.createElement("h3");
  titulo.textContent = "📅 Palabra del Día";

  const zonaPalabra = document.createElement("div");
  zonaPalabra.id = "zona-palabra-dia";
  mostrarPalabras([palabra], zonaPalabra);

  contenedor.appendChild(cerrar);
  contenedor.appendChild(titulo);
  contenedor.appendChild(zonaPalabra);

  document.body.appendChild(contenedor);
}

export function mostrarPalabraDelDiaManual() {
  const guardado = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  const palabra = palabras.find(p => p["Reo Tahiti"] === guardado.reo);
  if (palabra) {
    mostrarTarjetaFlotante(palabra);
  }
}
