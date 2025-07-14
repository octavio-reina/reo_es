const CLAVE_SECRETA = "maitaimaitai";
const URL_BASE = "https://script.google.com/macros/s/AKfycbxtW0R8yIqfGoUY0nJJQ9pBsdHjMBtXh61o8u6HX58HYce8Ubx167gzKAL0XZwfvKZO/exec";

let editandoID = null;
let palabrasCache = [];
let palabrasOriginales = [];
let paginaActual = 1;
const TAMANIO_PAGINA = 10;

function verificarClave() {
  const claveIngresada = document.getElementById("codigo").value.trim();
  if (claveIngresada === CLAVE_SECRETA) {
    localStorage.setItem("claveValida", "true");
    mostrarAdmin();
  } else {
    alert("Clave incorrecta.");
  }
}

function mostrarAdmin() {
  document.getElementById("clave").classList.add("oculto");
  document.getElementById("admin").classList.remove("oculto");
  cargarTabla();
}

function mostrarSeccion(seccion) {
  document.querySelectorAll(".tab-btn").forEach((btn) =>
    btn.classList.remove("active")
  );
  document.querySelectorAll("#agregar, #gestionar").forEach((sec) =>
    sec.classList.add("oculto")
  );
  document.getElementById(seccion).classList.remove("oculto");
  document
    .querySelector(`.tab-btn[onclick*='${seccion}']`)
    .classList.add("active");
  clearMensajes();

  const buscador = document.getElementById("busqueda");
  if (seccion === "gestionar") {
    buscador.classList.remove("oculto");
  } else {
    buscador.classList.add("oculto");
    buscador.value = "";
  }
}

function cargarTabla() {
  fetch(URL_BASE + "?accion=leer")
    .then((res) => res.json())
    .then((data) => {
      data.forEach((p) => {
        if (!p.id) {
          p.id = `reo.id.${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        }
      });
      palabrasOriginales = [...data].sort((a, b) =>
        a.reo.localeCompare(b.reo, "es", { sensitivity: "base" })
      );
      palabrasCache = [...palabrasOriginales];
      cargarCategorias();
      paginaActual = 1;
      renderizarTabla();
    })
    .catch((err) => {
      mostrarError("Error al cargar datos.");
      console.error(err);
    });
}

function renderizarTabla() {
  const tbody = document.querySelector("#tabla tbody");
  tbody.innerHTML = "";

  const inicio = (paginaActual - 1) * TAMANIO_PAGINA;
  const fin = inicio + TAMANIO_PAGINA;
  const datosPagina = palabrasCache.slice(inicio, fin);

  datosPagina.forEach((palabra) => {
    const truncarConTooltip = (texto, maxLen = 100) => {
      if (!texto) return "";
      if (texto.length <= maxLen) return texto;
      const corto = texto.substring(0, maxLen) + "...";
      return `<span title="${texto.replace(/"/g, "&quot;")}">${corto}</span>`;
    };

    const enlaces = (() => {
      try {
        return JSON.parse(palabra.enlaces || "[]");
      } catch {
        return [];
      }
    })();

    const mostrarEnlaces = () => {
      const ventana = window.open("", "_blank", "width=400,height=300,scrollbars=yes");
      const htmlEnlaces = enlaces
        .map(
          (enlace) =>
            `<li><a href="${enlace.url}" target="_blank" rel="noopener noreferrer">${enlace.texto || enlace.url}</a></li>`
        )
        .join("");
      ventana.document.write(`
        <html><head><title>Enlaces de referencia</title></head><body>
        <h2>Enlaces para "${palabra.reo}"</h2>
        <ul>${htmlEnlaces}</ul>
        <button onclick="window.close()">Cerrar</button>
        </body></html>
      `);
      ventana.document.close();
    };

    const fila = document.createElement("tr");

    fila.innerHTML = `
      <td class="sticky-col">${palabra.reo}</td>
      <td>${palabra.espanol}</td>
      <td>${palabra.categoria || ""}</td>
      <td>${truncarConTooltip(palabra.notas)}</td>
      <td>${truncarConTooltip(palabra.descripcion)}</td>
      <td>
        ${
          palabra.imagen
            ? `<img src="${palabra.imagen}" alt="Imagen de ${palabra.reo}" class="miniatura" loading="lazy" width="200" height="200" />`
            : "—"
        }
      </td>
      <td>
        ${
          enlaces.length > 0
            ? `<button class="ver-enlaces">Ver enlaces</button>`
            : "—"
        }
      </td>
      <td class="acciones">
        <button onclick='editar(${JSON.stringify(palabra)})'>✏️</button>
        <button onclick='eliminar("${palabra.id}")'>🗑️</button>
      </td>
    `;

    if (enlaces.length > 0) {
      fila.querySelector(".ver-enlaces").addEventListener("click", mostrarEnlaces);
    }

    tbody.appendChild(fila);
  });

  renderizarPaginacion();
}

function renderizarPaginacion() {
  const totalPaginas = Math.ceil(palabrasCache.length / TAMANIO_PAGINA);
  const contenedor = document.getElementById("paginacion");
  contenedor.innerHTML = "";
  if (totalPaginas <= 1) return;

  for (let i = 1; i <= totalPaginas; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    if (i === paginaActual) btn.classList.add("active");
    btn.onclick = () => {
      paginaActual = i;
      renderizarTabla();
    };
    contenedor.appendChild(btn);
  }
}

function filtrarTabla() {
  const query = document.getElementById("busqueda").value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (!query) {
    palabrasCache = [...palabrasOriginales];
  } else {
    palabrasCache = palabrasOriginales.filter(p => {
      const normalizar = (txt) =>
        (txt || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      return (
        normalizar(p.reo).includes(query) ||
        normalizar(p.espanol).includes(query) ||
        normalizar(p.categoria).includes(query) ||
        normalizar(p.notas).includes(query) ||
        normalizar(p.descripcion).includes(query)
      );
    });
  }
  paginaActual = 1;
  renderizarTabla();
}


function editar(palabra) {
  document.getElementById("reo").value = palabra.reo;
  document.getElementById("espanol").value = palabra.espanol;
  document.getElementById("categoria-select").value = palabra.categoria || "";
  mostrarInputCategoria();
  document.getElementById("categoria-nueva").value = "";
  document.getElementById("notas").value = palabra.notas || "";
  document.getElementById("descripcion").value = palabra.descripcion || "";
  document.getElementById("imagen-url").value = palabra.imagen || "";

  limpiarCamposEnlaces();
  try {
    const enlaces = JSON.parse(palabra.enlaces || "[]");
    enlaces.forEach(link => agregarCampoEnlace(link.url, link.texto));
  } catch {
    agregarCampoEnlace();
  }

  editandoID = palabra.id; // ✅ usar id, no reo
  mostrarSeccion("agregar");
  document.getElementById("titulo-form").textContent = `Editando: "${palabra.reo}" (${palabra.espanol})`;
  clearMensajes();
}

function mostrarInputCategoria() {
  const select = document.getElementById("categoria-select");
  const inputNueva = document.getElementById("categoria-nueva");
  if (select.value === "otra") {
    inputNueva.classList.remove("oculto");
  } else {
    inputNueva.classList.add("oculto");
    inputNueva.value = "";
  }
}

function cargarCategorias() {
  const select = document.getElementById("categoria-select");
  select.innerHTML = '<option value="">Selecciona categoría</option>';
  const categorias = [
    ...new Set(
      palabrasCache
        .map((p) => p.categoria && p.categoria.trim())
        .filter((c) => c && c !== "")
    ),
  ].sort();
  categorias.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    select.appendChild(opt);
  });
  const optOtra = document.createElement("option");
  optOtra.value = "otra";
  optOtra.textContent = "Otra...";
  select.appendChild(optOtra);
  mostrarInputCategoria();
}

function handleGuardar(btn) {
  btn.classList.add("active-click");
  setTimeout(() => btn.classList.remove("active-click"), 300);
  guardar();
}

function guardar() {
  clearMensajes();

  const reo = document.getElementById("reo").value.trim();
  const espanol = document.getElementById("espanol").value.trim();
  const categoriaSeleccionada = document.getElementById("categoria-select").value;
  const categoriaNueva = document.getElementById("categoria-nueva").value.trim();
  const categoria = categoriaSeleccionada === "otra" ? categoriaNueva : categoriaSeleccionada;
  const notas = document.getElementById("notas").value.trim();
  const descripcion = document.getElementById("descripcion").value.trim();
  const imagen = document.getElementById("imagen-url").value.trim();

  const enlaces = [];
  document.querySelectorAll(".campo-enlace").forEach(contenedor => {
    const url = contenedor.querySelector(".input-url").value.trim();
    const texto = contenedor.querySelector(".input-texto").value.trim();
    if (url) {
      enlaces.push({ url, texto });
    }
  });

  if (!reo || !espanol) {
    return mostrarError("Reo Tahiti y Español son obligatorios.");
  }

 // ✅ Validación de duplicados si no estamos editando
  if (!editandoID) {
    const dup = palabrasOriginales.find(
      (p) =>
        p.reo.trim().toLowerCase() === reo.toLowerCase() ||
        p.espanol.trim().toLowerCase() === espanol.toLowerCase()
    );
    if (dup) {
      const confirmar = confirm(
        `¡Atención! Ya existe una palabra parecida:\n\n` +
        `Reo Tahiti: ${dup.reo}\nEspañol: ${dup.espanol}\n\n` +
        `¿Deseas agregarla de todas formas?\nAceptar: Agregar de todas formas\nCancelar: Editar la palabra existente`
      );
      if (!confirmar) {
        editar(dup);
        return;
      }
    }
  }
  
  // Asignar ID único si no estamos editando
  const id = editandoID || `reo.id.${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  let url = `${URL_BASE}?accion=${editandoID ? "editar" : "agregar"}&id=${encodeURIComponent(id)}&reo=${encodeURIComponent(reo)}&espanol=${encodeURIComponent(espanol)}&categoria=${encodeURIComponent(categoria)}&notas=${encodeURIComponent(notas)}&descripcion=${encodeURIComponent(descripcion)}&imagen=${encodeURIComponent(imagen)}&enlaces=${encodeURIComponent(JSON.stringify(enlaces))}`;

  fetch(url)
    .then((res) => res.text())
    .then((data) => {
      if (data.trim() === "OK") {
        mostrarEstado(editandoID ? "✅ Palabra actualizada" : "✅ Palabra agregada");
        limpiarFormulario();
        cargarTabla();
      } else {
        mostrarError("❌ Error: " + data);
      }
    })
    .catch(() => {
      mostrarError("❌ Error al guardar.");
    });
}

function eliminar(id) {
  clearMensajes();
  if (!confirm("¿Eliminar esta palabra?")) return;
  fetch(`${URL_BASE}?accion=eliminar&id=${encodeURIComponent(id)}`)
    .then((res) => res.text())
    .then((data) => {
      if (data.trim() === "OK") {
        mostrarEstado("✅ Palabra eliminada");
        cargarTabla();
      } else {
        mostrarError("❌ Error al eliminar: " + data);
      }
    })
    .catch(() => {
      mostrarError("❌ Error al eliminar.");
    });
}

function limpiarCamposEnlaces() {
  document.getElementById("contenedor-enlaces").innerHTML = "";
  agregarCampoEnlace();
}

function agregarCampoEnlace(url = "", texto = "") {
  const contenedor = document.getElementById("contenedor-enlaces");
  const grupo = document.createElement("div");
  grupo.className = "campo-enlace";
  grupo.innerHTML = `
    <input type="text" class="input-url" placeholder="URL" value="${url}" />
    <input type="text" class="input-texto" placeholder="Texto del enlace" value="${texto}" />
    <button onclick="this.parentNode.remove()">❌</button>
  `;
  contenedor.appendChild(grupo);
}

function limpiarFormulario() {
  document.getElementById("reo").value = "";
  document.getElementById("espanol").value = "";
  document.getElementById("categoria-select").value = "";
  document.getElementById("categoria-nueva").value = "";
  document.getElementById("categoria-nueva").classList.add("oculto");
  document.getElementById("notas").value = "";
  document.getElementById("descripcion").value = "";
  document.getElementById("imagen-url").value = "";
  limpiarCamposEnlaces();
  document.getElementById("titulo-form").textContent = "Agregar nueva palabra";
  editandoID = null;
}

let cuentaRegresivaTimeout;
function mostrarEstado(mensaje) {
  clearMensajes();
  const estado = document.getElementById("estado");
  let segundos = 5;
  estado.textContent = `${mensaje} (${segundos})`;
  estado.classList.add("visible");

  cuentaRegresivaTimeout = setInterval(() => {
    segundos--;
    if (segundos > 0) {
      estado.textContent = `${mensaje} (${segundos})`;
    } else {
      clearInterval(cuentaRegresivaTimeout);
      estado.textContent = "";
      estado.classList.remove("visible");
    }
  }, 1000);
}

function mostrarError(mensaje) {
  clearMensajes();
  const error = document.getElementById("error");
  error.textContent = mensaje;
  error.classList.add("visible");
  setTimeout(() => {
    error.textContent = "";
    error.classList.remove("visible");
  }, 7000);
}

function clearMensajes() {
  clearInterval(cuentaRegresivaTimeout);
  document.getElementById("estado").textContent = "";
  document.getElementById("estado").classList.remove("visible");
  document.getElementById("error").textContent = "";
  document.getElementById("error").classList.remove("visible");
}

function cerrarSesion() {
  localStorage.removeItem("claveValida");
  location.reload();
}

document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("claveValida") === "true") {
    mostrarAdmin();
  }
});
