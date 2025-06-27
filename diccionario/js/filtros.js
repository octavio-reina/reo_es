import { palabras } from "./datos.js";
import { mostrarPalabras } from "./tarjeta.js";

let categoriaActual = "todas";
let mostrarFavoritos = false;

export function generarFiltros(lista) {
  const filtrosContainer = document.getElementById("filtros");
  if (!filtrosContainer) return;

  const categorias = Array.from(new Set(lista.map(p => p["Categoría"]).filter(Boolean))).sort();

  const select = document.createElement("select");
  select.id = "filtro-categoria";
  select.innerHTML = `<option value="todas">Todas las categorías</option>` +
    categorias.map(cat => `<option value="${cat}">${cat}</option>`).join("");
  select.addEventListener("change", () => {
    categoriaActual = select.value;
    filtrarPalabras();
  });

  const favCheckbox = document.createElement("label");
  favCheckbox.innerHTML = `
    <input type="checkbox" id="filtro-favoritos">
    Solo favoritos
  `;
  favCheckbox.querySelector("input").addEventListener("change", (e) => {
    mostrarFavoritos = e.target.checked;
    filtrarPalabras();
  });

  filtrosContainer.appendChild(select);
  filtrosContainer.appendChild(favCheckbox);
}

export function filtrarPalabras() {
  const normalizar = txt => (txt || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const query = normalizar(document.getElementById("buscador").value);
  const favoritos = JSON.parse(localStorage.getItem("favoritos") || "[]");

  const filtradas = palabras.filter(p => {
    const enBusqueda = normalizar(p["Reo Tahiti"]).includes(query) ||
                       normalizar(p["Español"]).includes(query) ||
                       normalizar(p["Categoría"]).includes(query);
    const enFavoritos = !mostrarFavoritos || favoritos.includes(p["Reo Tahiti"]);
    const enCategoria = categoriaActual === "todas" || p["Categoría"] === categoriaActual;
    return enBusqueda && enFavoritos && enCategoria;
  });

  mostrarPalabras(filtradas);
}
