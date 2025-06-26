const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTP_ja-WseSt4TpwV3sLoeMjjFcz7NEY8n0CS4mJ12iseR8sjYI-gZ8T_kp1vOd8v2TKVjKPFFT_lW1/pub?gid=0&single=true&output=csv";

//Variables
let palabras = [];
let categoriaActual = "todas";
let mostrarFavoritos = false;
let audioEnReproduccion = null;

document.addEventListener("DOMContentLoaded", () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/reo_es/service-worker.js')
      .then(reg => console.log("✅ Service Worker registrado:", reg.scope))
      .catch(err => console.error("❌ Error al registrar Service Worker:", err));
  }

  if (document.getElementById("resultados")) {
    cargarDatos();
  }

  const buscador = document.getElementById("buscador");
  if (buscador) {
    buscador.addEventListener("input", filtrarPalabras);
  }

  const filtros = document.getElementById("filtros");
  if (filtros) {
    filtros.addEventListener("change", filtrarPalabras);
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
      generarFiltros(palabras);
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

function extraerEnlacesTexto(jsonStr) {
  try {
    const enlaces = JSON.parse(jsonStr);
    return enlaces.map(e => `${e.texto || e.url}: ${e.url}`).join("\n");
  } catch {
    return "";
  }
}

function generarFiltros(lista) {
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

function filtrarPalabras() {
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

function mostrarPalabras(lista) {
  const container = document.getElementById("resultados");
  container.innerHTML = "";

  if (lista.length === 0) {
    container.innerHTML = "<p>No se encontraron resultados.</p>";
    return;
  }

  let tarjetaAbierta = null;
  const favoritos = JSON.parse(localStorage.getItem("favoritos") || "[]");

  lista.forEach(palabra => {
    const tarjeta = document.createElement("div");
    tarjeta.className = "tarjeta";

    const cabecera = document.createElement("div");
    cabecera.className = "cabecera";

    const filaTop = document.createElement("div");
    filaTop.style.display = "flex";
    filaTop.style.alignItems = "center";
    filaTop.style.justifyContent = "space-between";
    filaTop.style.flexWrap = "wrap";

    const reoTahiti = document.createElement("div");
    reoTahiti.className = "reo-tahiti";
    reoTahiti.textContent = palabra["Reo Tahiti"];

    const acciones = document.createElement("div");
    acciones.className = "acciones-tarjeta";
    acciones.style.display = "flex";
    acciones.style.gap = "0.6rem";

    // Compartir
    const btnShare = document.createElement("button");
    btnShare.innerHTML = "📤";
    btnShare.title = "Compartir";
   btnShare.onclick = (e) => {
  e.stopPropagation();
 const partes = [];

partes.push(`📘 ${palabra["Reo Tahiti"]} – ${palabra["Español"]}`);

if (palabra["Categoría"]) {
  partes.push(`📂 Categoría: ${palabra["Categoría"]}`);
}

if (palabra["Notas"]) {
  partes.push(`📝 Notas:\n${palabra["Notas"]}`);
}

if (palabra["Descripción"]) {
  partes.push(`📖 Descripción:\n${palabra["Descripción"]}`);
}

if (palabra["Enlaces"]) {
  const enlacesTexto = extraerEnlacesTexto(palabra["Enlaces"]);
  if (enlacesTexto.trim() !== "") {
    partes.push(`🔗 Enlaces:\n${enlacesTexto}`);
  }
}

const contenido = partes.join("\n\n");


  if (navigator.share) {
    navigator.share({ text: contenido });
  } else {
    navigator.clipboard.writeText(contenido);
    alert("Texto copiado para compartir.");
  }
};
    acciones.appendChild(btnShare);

     // Copiar
const btnCopiar = document.createElement("button");
btnCopiar.innerHTML = "📋";
btnCopiar.title = "Copiar palabra";
btnCopiar.setAttribute("aria-label", `Copiar la palabra ${palabra["Reo Tahiti"]}`);
btnCopiar.onclick = (e) => {
  e.stopPropagation();
  navigator.clipboard.writeText(palabra["Reo Tahiti"]).then(() => {
    btnCopiar.innerHTML = "✅";
    btnCopiar.title = "Copiado ✅";
    setTimeout(() => {
      btnCopiar.innerHTML = "📋";
      btnCopiar.title = "Copiar palabra";
    }, 1000);
  });
};
acciones.appendChild(btnCopiar);


    // Favorito
    const btnFav = document.createElement("button");
    const id = palabra["Reo Tahiti"];
    btnFav.innerHTML = favoritos.includes(id) ? "⭐" : "☆";
    btnFav.title = "Agregar a favoritos";
    btnFav.onclick = (e) => {
      e.stopPropagation();
      if (favoritos.includes(id)) {
        favoritos.splice(favoritos.indexOf(id), 1);
        btnFav.innerHTML = "☆";
      } else {
        favoritos.push(id);
        btnFav.innerHTML = "⭐";
      }
      localStorage.setItem("favoritos", JSON.stringify(favoritos));
      filtrarPalabras(); // actualizar vista si filtro está activo
    };
    acciones.appendChild(btnFav);

    // Audio (si existe)
    if (palabra["Audio"]) {
  const btnAudio = document.createElement("button");
  btnAudio.innerHTML = "🔊";
  btnAudio.title = "Reproducir audio";

  btnAudio.onclick = (e) => {
    e.stopPropagation();

    // Si ya hay un audio reproduciéndose
    if (audioEnReproduccion) {
      audioEnReproduccion.pause();
      audioEnReproduccion.currentTime = 0;
      audioEnReproduccion = null;
      btnAudio.innerHTML = "🔊";
      btnAudio.title = "Reproducir audio";
      return;
    }

    // Crear nuevo audio
    const audio = new Audio(palabra["Audio"]);
    audio.play().catch(err => console.error("No se pudo reproducir:", err));
    audioEnReproduccion = audio;

    // Cambiar ícono e indicar que se puede detener
    btnAudio.innerHTML = "⏹️";
    btnAudio.title = "Detener audio";

    // Restaurar ícono cuando termina
    audio.onended = () => {
      audioEnReproduccion = null;
      btnAudio.innerHTML = "🔊";
      btnAudio.title = "Reproducir audio";
    };
  };

  // 👉 Agregar al lado derecho del texto
  reoTahiti.appendChild(btnAudio);
}


    filaTop.appendChild(reoTahiti);
    filaTop.appendChild(acciones);
    cabecera.appendChild(filaTop);

    const espanol = document.createElement("div");
    espanol.className = "espanol";
    espanol.textContent = palabra["Español"];
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
        tarjetaAbierta.parentElement.querySelector(".reo-tahiti")?.classList.remove("activo");
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
