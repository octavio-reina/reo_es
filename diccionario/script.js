const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTP_ja-WseSt4TpwV3sLoeMjjFcz7NEY8n0CS4mJ12iseR8sjYI-gZ8T_kp1vOd8v2TKVjKPFFT_lW1/pub?gid=0&single=true&output=csv";

let palabras = [];

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/reo_es/service-worker.js')
      .then(reg => console.log("✅ Service Worker registrado:", reg.scope))
      .catch(err => console.error("❌ Error al registrar Service Worker:", err));
  });
}

document.addEventListener("DOMContentLoaded", () => {

  if (document.getElementById("resultados")) {
    cargarDatos();
  }

  const buscador = document.getElementById("buscador");
  if (buscador) {
    buscador.addEventListener("input", filtrarPalabras);
  }

  const toggles = document.querySelectorAll("#menu-toggle");
  const menu = document.getElementById("menu");
  const close = document.getElementById("menu-close");

  toggles.forEach(toggle => {
    toggle.addEventListener("click", () => {
      menu.classList.add("activo");
      document.body.classList.add("menu-abierto");
    });
  });

  if (close) {
    close.addEventListener("click", () => {
      menu.classList.remove("activo");
      document.body.classList.remove("menu-abierto");
    });
  }
});

function cargarDatos() {
  Papa.parse(CSV_URL, {
    download: true,
    header: true,
    complete: function(results) {
      palabras = results.data;
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
      const textoConSaltos = palabra["Descripción"].replace(/\n/g, "<br>");
      descripcion.innerHTML = `<strong>Descripción:</strong><br>${textoConSaltos}`;
      contenido.appendChild(descripcion);
    }

    if (palabra["Imagen"]) {
      const img = document.createElement("img");
      img.src = palabra["Imagen"];
      img.alt = palabra["Reo Tahiti"];
      img.loading = "lazy";
      img.className = "imagen-palabra";
      contenido.appendChild(img);
    }

    if (palabra["Enlaces"]) {
      try {
        const enlaces = JSON.parse(palabra["Enlaces"]);
        if (Array.isArray(enlaces) && enlaces.length > 0) {
          const titulo = document.createElement("p");
          titulo.innerHTML = "<strong>Referencias:</strong>";

          const listaEnlaces = document.createElement("ul");
          enlaces.forEach(enlace => {
            const li = document.createElement("li");
            const a = document.createElement("a");
            a.href = enlace.url;
            a.target = "_blank";
            a.rel = "noopener noreferrer";
            a.textContent = enlace.texto || enlace.url;
            li.appendChild(a);
            listaEnlaces.appendChild(li);
          });

          contenido.appendChild(titulo);
          contenido.appendChild(listaEnlaces);
        }
      } catch (e) {
        console.warn("❌ Error al parsear enlaces:", palabra["Enlaces"]);
      }
    }

    cabecera.addEventListener("click", () => {
      const yaEstaVisible = contenido.classList.contains("visible");

      if (tarjetaAbierta && tarjetaAbierta !== contenido) {
        tarjetaAbierta.classList.remove("visible");
        const reoActivo = tarjetaAbierta.parentElement.querySelector(".reo-tahiti.activo");
        if (reoActivo) reoActivo.classList.remove("activo");
      }

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
