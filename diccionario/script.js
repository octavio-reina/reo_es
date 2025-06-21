const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTP_ja-WseSt4TpwV3sLoeMjjFcz7NEY8n0CS4mJ12iseR8sjYI-gZ8T_kp1vOd8v2TKVjKPFFT_lW1/pub?gid=0&single=true&output=csv";

let palabras = [];

document.addEventListener("DOMContentLoaded", () => {
  cargarDatos();
  document.getElementById("buscador").addEventListener("input", filtrarPalabras);
});


document.addEventListener("DOMContentLoaded", () => {
  const toggles = document.querySelectorAll("#menu-toggle");
  const menu = document.getElementById("menu");

  toggles.forEach(toggle => {
    toggle.addEventListener("click", () => {
      menu.classList.toggle("activo");
      document.body.classList.toggle("menu-abierto");
    });
  });
});


function cargarDatos() {
  Papa.parse(CSV_URL, {
    download: true,
    header: true,
    complete: function(results) {
      palabras = results.data;

      // Ordenar alfabéticamente antes de mostrar
      ordenarAlfabeticamente(palabras);

      mostrarPalabras(palabras);
    },
    error: function(err) {
      document.getElementById("resultados").innerHTML = `<p>Error al cargar datos: ${err.message}</p>`;
    }
  });
}

function ordenarAlfabeticamente(lista) {
  lista.sort((a, b) => {
    const strA = (a["Reo Tahiti"] || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const strB = (b["Reo Tahiti"] || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    // Usar localeCompare con sensibilidad base para ignorar acentos y diacríticos
    return strA.localeCompare(strB, 'es', { sensitivity: 'base' });
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

  let tarjetaAbierta = null;

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
      const links = palabra["Enlaces"]
        .split(",")
        .map(e => e.trim())
        .filter(e => e !== "");

      if (links.length > 0) {
        const titulo = document.createElement("p");
        titulo.innerHTML = "<strong>Referencias:</strong>";

        const listaEnlaces = document.createElement("ul");
        listaEnlaces.innerHTML = links.map(link =>
          `<li><a href="${link}" target="_blank" rel="noopener noreferrer">${link}</a></li>`
        ).join("");

        contenido.appendChild(titulo);
        contenido.appendChild(listaEnlaces);
      }
    }

    cabecera.addEventListener("click", () => {
      const yaEstaVisible = contenido.classList.contains("visible");

      // Cierra la tarjeta abierta si existe
      if (tarjetaAbierta && tarjetaAbierta !== contenido) {
        tarjetaAbierta.classList.remove("visible");
        const reoActivo = tarjetaAbierta.parentElement.querySelector(".reo-tahiti.activo");
        if (reoActivo) reoActivo.classList.remove("activo");
      }

      // Si no era la misma, ábrela; si sí, solo cierra
      if (!yaEstaVisible) {
        contenido.classList.add("visible");
        reoTahiti.classList.add("activo");
        tarjetaAbierta = contenido;
      } else {
        contenido.classList.remove("visible");
        reoTahiti.classList.remove("activo");
        tarjetaAbierta = null;
      }
    });

    tarjeta.appendChild(cabecera);
    tarjeta.appendChild(contenido);
    container.appendChild(tarjeta);
  });
}
