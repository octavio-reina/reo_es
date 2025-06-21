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

    const reoTahiti = document.createElement("div");
    reoTahiti.className = "reo-tahiti";
    reoTahiti.textContent = palabra["Reo Tahiti"];

    const espanol = document.createElement("div");
    espanol.className = "espanol";
    espanol.textContent = palabra["Español"];

    cabecera.appendChild(reoTahiti);
    cabecera.appendChild(espanol);

    if (palabra["Categoría"]) {
      const categoria = document.createElement("div");
      categoria.className = "categoria";
      categoria.textContent = palabra["Categoría"];
      cabecera.appendChild(categoria);
    }

    const contenido = document.createElement("div");
    contenido.className = "contenido-oculto";

    if (palabra["Notas"]) {
      const notas = document.createElement("p");
      notas.innerHTML = `<strong>Notas:</strong> ${palabra["Notas"]}`;
      contenido.appendChild(notas);
    }

    if (palabra["Descripción"]) {
      const descripcion = document.createElement("p");
      descripcion.innerHTML = `<strong>Descripción:</strong> ${palabra["Descripción"]}`;
      contenido.appendChild(descripcion);
    }

    if (palabra["Imagen"]) {
      const img = document.createElement("img");
      img.src = palabra["Imagen"];
      img.className = "imagen-palabra";
      contenido.appendChild(img);
    }

    if (palabra["Enlaces"]) {
      const links = palabra["Enlaces"].split(",").map(e => e.trim());
      const lista = document.createElement("ul");
      lista.innerHTML = links.map(e => `<li><a href="${e}" target="_blank">${e}</a></li>`).join("");
      const titulo = document.createElement("p");
      titulo.innerHTML = "<strong>Referencias:</strong>";
      contenido.appendChild(titulo);
      contenido.appendChild(lista);
    }

    cabecera.addEventListener("click", () => {
      contenido.classList.toggle("visible");
      reoTahiti.classList.toggle("activo");
    });

    tarjeta.appendChild(cabecera);
    tarjeta.appendChild(contenido);
    container.appendChild(tarjeta);
  });
}
