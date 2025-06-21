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

    const cabecera = document.createElement("div");
    cabecera.className = "cabecera";
    cabecera.innerHTML = `
      <span class="reo-tahiti">${palabra["Reo Tahiti"]}</span>
      <span class="espanol">${palabra["Español"]}</span>
      ${palabra["Categoría"] ? `<span class="categoria">${palabra["Categoría"]}</span>` : ''}
    `;

    const contenido = document.createElement("div");
    contenido.className = "contenido-oculto";

    if (palabra["Notas"]) {
      contenido.innerHTML += `<p><strong>Notas:</strong> ${palabra["Notas"]}</p>`;
    }

    if (palabra["Descripción"]) {
      contenido.innerHTML += `<p><strong>Descripción:</strong> ${palabra["Descripción"]}</p>`;
    }

    if (palabra["Imagen"]) {
      contenido.innerHTML += `<img src="${palabra["Imagen"]}" alt="Imagen relacionada" class="imagen-palabra" />`;
    }

    if (palabra["Enlaces"]) {
      const enlaces = palabra["Enlaces"].split(",").map(e => e.trim());
      contenido.innerHTML += `<p><strong>Referencias:</strong></p><ul>` +
        enlaces.map(e => `<li><a href="${e}" target="_blank" rel="noopener noreferrer">${e}</a></li>`).join("") +
        `</ul>`;
    }

    cabecera.addEventListener("click", () => {
      contenido.classList.toggle("visible");
      const reoSpan = cabecera.querySelector(".reo-tahiti");
      if (reoSpan) reoSpan.classList.toggle("activo");
    });

    tarjeta.appendChild(cabecera);
    tarjeta.appendChild(contenido);
    container.appendChild(tarjeta);
  });
}
