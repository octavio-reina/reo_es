// palabraDelDia.js
import { palabras } from "./datos.js";
import { mostrarPalabraComoTarjeta } from "./tarjeta.js";

// Obtener la palabra del día del almacenamiento
function obtenerPalabraDelDia() {
  const hoy = new Date().toISOString().slice(0, 10);
  const almacenada = JSON.parse(localStorage.getItem("palabraDelDia") || "{}");

  if (almacenada.fecha === hoy && almacenada.palabra) {
    return almacenada.palabra;
  }

  // Generar nueva palabra aleatoria
  const conImagen = palabras.filter(p => p["Reo Tahiti"] && p["Español"]);
  const nueva = conImagen[Math.floor(Math.random() * conImagen.length)];

  localStorage.setItem("palabraDelDia", JSON.stringify({ fecha: hoy, palabra: nueva }));
  return nueva;
}

// Crear y mostrar la tarjeta flotante
export function mostrarPalabraDelDia() {
  const palabra = obtenerPalabraDelDia();
  if (!palabra) return;

  const flotante = document.createElement("div");
  flotante.id = "tarjeta-del-dia";
  flotante.className = "tarjeta flotante";

  const cerrarBtn = document.createElement("button");
  cerrarBtn.textContent = "✖️";
  cerrarBtn.className = "cerrar-tarjeta";
  cerrarBtn.onclick = () => flotante.remove();

  const contenido = mostrarPalabraComoTarjeta(palabra, true); // true = no bindea eventos de click
  flotante.appendChild(cerrarBtn);
  flotante.appendChild(contenido);

  document.body.appendChild(flotante);
}

// Muestra botón para volver a ver la palabra del día
export function setupBotonPalabraDelDia() {
  const contenedor = document.getElementById("buscador-container") || document.getElementById("buscador")?.parentElement;
  if (!contenedor) return;

  const btn = document.createElement("button");
  btn.id = "btn-palabra-dia";
  btn.textContent = "🌞 Palabra del día";
  btn.onclick = mostrarPalabraDelDia;

  contenedor.appendChild(btn);
}
