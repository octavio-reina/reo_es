import { palabras } from './datos.js';
import { obtenerFavoritos, toggleFavorito } from './favoritos.js';
import { manejarAudio } from './audio.js';
import { construirTextoCompartido } from './compartir.js';

let categoriaActual = "todas";
let mostrarFavoritos = false;

export function configurarUI() {
  const buscador = document.getElementById("buscador");
  buscador?.addEventListener("input", filtrarPalabras);

  const filtros = document.getElementById("filtros");
  filtros?.addEventListener("change", filtrarPalabras);

  generarFiltros();
}

export function filtrarPalabras() {
  const query = normalizar(document.getElementById("buscador").value);
  const favoritos = obtenerFavoritos();

  const filtradas = palabras.filter(p => {
    const enBusqueda = [p["Reo Tahiti"], p["Español"], p["Categoría"]].some(campo =>
      normalizar(campo || "").includes(query)
    );
    const enFavoritos = !mostrarFavoritos || favoritos.includes(p["Reo Tahiti"]);
    const enCategoria = categoriaActual === "todas" || p["Categoría"] === categoriaActual;
    return enBusqueda && enFavoritos && enCategoria;
  });

  mostrarPalabras(filtradas);
}

function normalizar(txt) {
  return (txt || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function generarFiltros() {
  const filtrosContainer = document.getElementById("filtros");
  if (!filtrosContainer) return;

  const categorias = Array.from(new Set(palabras.map(p => p["Categoría"]).filter(Boolean))).sort();

  const select = document.createElement("select");
  select.id = "filtro-categoria";
  select.innerHTML = `<option value="todas">Todas las categorías</option>` +
    categorias.map(cat => `<option value="${cat}">${cat}</option>`).join("");

  select.addEventListener("change", () => {
    categoriaActual = select.value;
    filtrarPalabras();
  });

  const favCheckbox = document.createElement("label");
  favCheckbox.innerHTML = `<input type="checkbox" id="filtro-favoritos"> Solo favoritos`;
  favCheckbox.querySelector("input").addEventListener("change", e => {
    mostrarFavoritos = e.target.checked;
    filtrarPalabras();
  });

  filtrosContainer.innerHTML = ""; // Limpia si ya existía
  filtrosContainer.appendChild(select);
  filtrosContainer.appendChild(favCheckbox);
}

function mostrarPalabras(lista) {
  const container = document.getElementById("resultados");
  container.innerHTML = "";

  if (lista.length === 0) {
    container.innerHTML = "<p>No se encontraron resultados.</p>";
    return;
  }

  lista.forEach(palabra => {
    const tarjeta = document.createElement("div");
    tarjeta.className = "tarjeta";

    const cabecera = document.createElement("div");
    cabecera.className = "cabecera";

    const filaTop = document.createElement("div");
    filaTop.className = "fila-top";

    const reoTahiti = document.createElement("div");
    reoTahiti.className = "reo-tahiti";
    reoTahiti.textContent = palabra["Reo Tahiti"];

    const acciones = document.createElement("div");
    acciones.className = "acciones-tarjeta";

    const btnShare = document.createElement("button");
    btnShare.innerHTML = "📤";
    btnShare.title = "Compartir";
    btnShare.onclick = (e) => {
      e.stopPropagation();
      const texto = construirTextoCompartido(palabra);
      if (navigator.share) navigator.share({ text: texto });
      else {
        navigator.clipboard.writeText(texto);
        alert("Texto copiado para compartir.");
      }
    };
    acciones.appendChild(btnShare);

    const btnCopiar = document.createElement("button");
    btnCopiar.innerHTML = "📋";
    btnCopiar.title = "Copiar palabra";
    btnCopiar.setAttribute("aria-label", `Copiar la palabra ${palabra["Reo Tahiti"]}`);
    btnCopiar.onclick = (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(palabra["Reo Tahiti"]).then(() => {
        btnCopiar.innerHTML = "✅";
        setTimeout(() => (btnCopiar.innerHTML = "📋"), 1000);
      });
    };
    acciones.appendChild(btnCopiar);

    const btnFav = document.createElement("button");
    const id = palabra["Reo Tahiti"];
    btnFav.innerHTML = obtenerFavoritos().includes(id) ? "⭐" : "☆";
    btnFav.title = "Agregar a favoritos";
    btnFav.onclick = (e) => {
      e.stopPropagation();
      const esFavorito = toggleFavorito(id);
      btnFav.innerHTML = esFavorito ? "⭐" : "☆";
      filtrarPalabras();
    };
    acciones.appendChild(btnFav);

    if (palabra["Audio"]) {
      const btnAudio = document.createElement("button");
      btnAudio.innerHTML = "🔊";
      btnAudio.title = "Reproducir audio";
      btnAudio.onclick = (e) => {
        e.stopPropagation();
        manejarAudio(palabra["Audio"], btnAudio);
      };
      reoTahiti.appendChild(btnAudio);
    }

    filaTop.appendChild(reoTahiti);
    filaTop.appendChild(acciones);
    cabecera.appendChild(filaTop);

    const espanol = document.createElement("div");
    espanol.className = "espanol";
    espanol.textContent = palabra["Español"];
    cabecera.appendChild(espanol);

    tarjeta.appendChild(cabecera);
    container.appendChild(tarjeta);
  });
}
