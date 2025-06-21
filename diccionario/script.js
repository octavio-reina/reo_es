// URL pública del CSV publicado desde Google Sheets
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTP_ja-WseSt4TpwV3sLoeMjjFcz7NEY8n0CS4mJ12iseR8sjYI-gZ8T_kp1vOd8v2TKVjKPFFT_lW1/pub?gid=0&single=true&output=csv";

let palabras = [];

document.addEventListener("DOMContentLoaded", () => {
  cargarDatos();
  document.getElementById("buscador").addEventListener("input", filtrarPalabras);
});

function cargarDatos() {
  Papa.parse(CSV_URL, {
    download: true,
    header: true,
    complete: function(results) {
      palabras = results.data;
      mostrarPalabras(palabras);
    },
    error: function(err) {
      document.getElementById("resultados").innerHTML = `<p>Error al cargar datos: ${err.message}</p>`;
    }
  });
}

function filtrarPalabras() {
  const query = document.getElementById("buscador").value.toLowerCase();
  const filtradas = palabras.filter(p =>
    (p["Reo Tahiti"] || "").toLowerCase().includes(query) ||
    (p["Español"] || "").toLowerCase().includes(query) ||
    (p["Categoría"] || "").toLowerCase().includes(query)
  );
  mostrarPalabras(filtradas);
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

    // Cabecera con reo tahiti en bold, tamaño grande, color azul
    const cabecera = document.createElement("div");
    cabecera.className = "cabecera";

    // Crear el span para Reo Tahiti, para poder cambiar color al hacer click
    const reoSpan = document.createElement("span");
    reoSpan.className = "reo-tahiti";
    reoSpan.textContent = palabra["Reo Tahiti"] || "-";

    // Español y categoría
    const espanolSpan = document.createElement("span");
    espanolSpan.className = "espanol";
    espanolSpan.textContent = ` — ${palabra["Español"] || "-"}`;

    const categoriaSpan = document.createElement("span");
    categoriaSpan.className = "categoria";
    if (palabra["Categoría"]) {
      categoriaSpan.textContent = ` (${palabra["Categoría"]})`;
    }

    cabecera.appendChild(reoSpan);
    cabecera.appendChild(espanolSpan);
    cabecera.appendChild(categoriaSpan);

    // Contenido oculto con detalles
    const contenido = document.createElement("div");
    contenido.className = "contenido-oculto";

    if (palabra["Notas"]) {
      contenido.innerHTML += `<p><strong>Notas:</strong> ${palabra["Notas"]}</p>`;
    }
    if (palabra["Descripción"]) {
      contenido.innerHTML += `<p><strong>Descripción:</strong> ${palabra["Descripción"]}</p>`;
    }
    if (palabra["Imagen"]) {
      contenido.innerHTML += `<img src="${palabra["Imagen"]}" alt="Imagen relacionada con ${palabra["Reo Tahiti"]}" class="imagen-palabra" />`;
    }
    if (palabra["Enlaces"]) {
      const enlaces = palabra["Enlaces"].split(",").map(e => e.trim());
      contenido.innerHTML += `<p><strong>Referencias:</strong></p><ul>` +
        enlaces.map(e => `<li><a href="${e}" target="_blank" rel="noopener noreferrer">${e}</a></li>`).join("") +
        `</ul>`;
    }

    // Al hacer click en la cabecera: mostrar/ocultar contenido y cambiar color de reo tahiti
    cabecera.addEventListener("click", () => {
      contenido.classList.toggle("visible");
      reoSpan.classList.toggle("activo");
    });

    tarjeta.appendChild(cabecera);
    tarjeta.appendChild(contenido);
    container.appendChild(tarjeta);
  });
}
