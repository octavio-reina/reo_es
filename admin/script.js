const CLAVE_SECRETA = "maitaimaitai";
const URL_BASE = "https://script.google.com/macros/s/AKfycbzyko9T3CmYthKNPEEAVdW9m4TfKpUjuQ4tAz0RK0DA1o9tw3zz-IO0ipRY5HXIwpr9/exec";

let editandoID = null;
let palabrasCache = [];
let palabrasOriginales = [];
let paginaActual = 1;
const TAMANIO_PAGINA = 10;

/* ===========================
   Autenticación simple
   =========================== */
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

/* ===========================
   Tabs
   =========================== */
function mostrarSeccion(seccion) {
  document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
  document.querySelectorAll("#agregar, #gestionar").forEach(sec => sec.classList.add("oculto"));
  document.getElementById(seccion).classList.remove("oculto");
  document.querySelector(`.tab-btn[onclick*='${seccion}']`).classList.add("active");
  clearMensajes();

  const buscador = document.getElementById("busqueda");
  if (seccion === "gestionar") {
    buscador.classList.remove("oculto");
  } else {
    buscador.classList.add("oculto");
    buscador.value = "";
  }
}

/* ===========================
   CRUD
   =========================== */
function cargarTabla() {
  fetch(URL_BASE + "?accion=leer")
    .then(res => res.json())
    .then(data => {
      data.forEach(p => {
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
    .catch(err => {
      mostrarError("Error al cargar datos.");
      console.error(err);
    });
}

function guardar() {
  clearMensajes();

  const reo = document.getElementById("reo").value.trim();
  const espanol = document.getElementById("espanol").value.trim();
  const categoriaSel = document.getElementById("categoria-select").value;
  const categoriaNueva = document.getElementById("categoria-nueva").value.trim();
  const categoria = categoriaSel === "otra" ? categoriaNueva : categoriaSel;
  const notas = document.getElementById("notas").value.trim();
  const descripcion = document.getElementById("descripcion").value.trim();
  let imagen = transformarLinkImagen(document.getElementById("imagen-url").value.trim());

  const enlaces = [];
  document.querySelectorAll(".campo-enlace").forEach(contenedor => {
    const url = contenedor.querySelector(".input-url").value.trim();
    const texto = contenedor.querySelector(".input-texto").value.trim();
    if (url) enlaces.push({ url, texto });
  });

  if (!reo || !espanol) return mostrarError("Reo Tahiti y Español son obligatorios.");

  const id = editandoID || `reo.id.${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  const params = new URLSearchParams({
    accion: editandoID ? "editar" : "agregar",
    id, reo, espanol,
    categoria, notas, descripcion,
    imagen,
    enlaces: JSON.stringify(enlaces)
  });

  fetch(`${URL_BASE}?${params.toString()}`)
    .then(res => res.json())
    .then(resp => {
      if (resp.ok) {
        mostrarEstado(editandoID ? "✅ Palabra actualizada" : "✅ Palabra agregada");
        limpiarFormulario();
        cargarTabla();
      } else {
        mostrarError("❌ Error: " + (resp.error || "Desconocido"));
      }
    })
    .catch(() => mostrarError("❌ Error al guardar."));
}

function eliminar(id) {
  clearMensajes();
  if (!confirm("¿Eliminar esta palabra?")) return;

  fetch(`${URL_BASE}?accion=eliminar&id=${encodeURIComponent(id)}`)
    .then(res => res.json())
    .then(resp => {
      if (resp.ok) {
        mostrarEstado("✅ Palabra eliminada");
        cargarTabla();
      } else {
        mostrarError("❌ Error al eliminar: " + (resp.error || "Desconocido"));
      }
    })
    .catch(() => mostrarError("❌ Error al eliminar."));
}

/* ===========================
   Subida de imágenes sin preflight
   =========================== */
async function subirImagenSeleccionada() {
  clearMensajes();

  const fileInput = document.getElementById("imagen-file");
  const estadoDiv = document.getElementById("imagen-upload-estado");
  const previewWrapper = document.getElementById("imagen-preview-wrapper");
  const previewImg = document.getElementById("imagen-preview");
  const boton = document.getElementById("btn-subir-imagen");

  if (!fileInput.files.length) return mostrarError("Selecciona un archivo antes de subir.");
  const archivo = fileInput.files[0];
  if (!archivo.type.startsWith("image/")) return mostrarError("Solo se permiten imágenes.");
  if (archivo.size > 2 * 1024 * 1024) return mostrarError("El archivo no debe superar 2MB.");

  const readerPreview = new FileReader();
  readerPreview.onload = e => {
    previewImg.src = e.target.result;
    previewWrapper.classList.remove("oculto");
  };
  readerPreview.readAsDataURL(archivo);

  boton.disabled = true;
  boton.textContent = "Subiendo...";
  estadoDiv.textContent = "Subiendo imagen al repositorio...";

  try {
    const base64 = await convertirArchivoBase64(archivo);
    const timestamp = Date.now();
    const nombreArchivo = archivo.name
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "_").replace(/[^\w.\-]/g, "").toLowerCase();
    const nombreFinal = `img_${timestamp}_${nombreArchivo}`;

    const formData = new FormData();
    formData.append("accion", "subirImagen");
    formData.append("nombre", nombreFinal);
    formData.append("base64", base64);

    const resp = await fetch(URL_BASE, {
      method: "POST",
      body: formData // Sin headers → evita preflight
    });

    const data = await resp.json();
    if (data.ok && data.url) {
      estadoDiv.textContent = "✅ Imagen subida correctamente.";
      estadoDiv.style.color = "green";
      document.getElementById("imagen-url").value = data.url;
      previewImg.src = data.url;
    } else {
      estadoDiv.textContent = "❌ Error: " + (data.error || "Desconocido");
      estadoDiv.style.color = "red";
    }
  } catch (err) {
    console.error(err);
    estadoDiv.textContent = "❌ Error en la subida.";
    estadoDiv.style.color = "red";
  } finally {
    boton.disabled = false;
    boton.textContent = "Subir Imagen";
  }
}

function convertirArchivoBase64(archivo) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(archivo);
  });
}

/* ===========================
   Otros helpers (paginación, enlaces, categorías, etc.)
   =========================== */
/* ===========================
   Mensajes de estado / error
   =========================== */
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

  editandoID = palabra.id;
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


document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("claveValida") === "true") mostrarAdmin();
});
