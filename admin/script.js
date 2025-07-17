const CLAVE_SECRETA = "maitaimaitai";
const URL_BASE = "https://script.google.com/macros/s/AKfycbyc38XWT72cG6-g4sF3gbEeHG5DFH7i3GLrFjERrRjOr6qpMWBY54epf_nfv-y2YgMP/exec";

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

  datosPagina.forEach((palabra, i) => {
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

    const indexGlobal = palabrasCache.indexOf(palabra);

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
        <button onclick='editarDesdeIndice(${indexGlobal})'>✏️</button>
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

function transformarLinkImagen(url) {
  if (!url) return "";

  url = url.trim();

  // Si es link directo a imagen
  const extensiones = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
  if (extensiones.some(ext => url.toLowerCase().includes(ext))) {
    return url;
  }

  // Si es link de Google Drive
  if (url.includes("drive.google.com")) {
    const match = url.match(/(?:\/d\/|id=)([a-zA-Z0-9_-]{10,})/);
    if (match && match[1]) {
      const fileId = match[1];
      return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }
  }

  return url; // Devuelve el original si no se puede transformar
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
  let imagen = document.getElementById("imagen-url").value.trim();
  imagen = transformarLinkImagen(imagen);

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

function editarDesdeIndice(indice) {
  const palabra = palabrasCache[indice];
  if (palabra) editar(palabra);
}


function cerrarSesion() {
  localStorage.removeItem("claveValida");
  location.reload();
}

// SUBIDA DE IMÁGENES A GITHUB (via Apps Script doPost)
async function subirImagenSeleccionada() {
  clearMensajes();

  const fileInput = document.getElementById("imagen-file");
  const estadoDiv = document.getElementById("imagen-upload-estado");
  const previewWrapper = document.getElementById("imagen-preview-wrapper");
  const previewImg = document.getElementById("imagen-preview");
  const boton = document.getElementById("btn-subir-imagen");

  if (!fileInput.files.length) {
    mostrarError("Selecciona un archivo antes de subir.");
    return;
  }

  const archivo = fileInput.files[0];

  // Validación básica: tipo imagen
  if (!archivo.type.startsWith("image/")) {
    mostrarError("Solo se permiten archivos de imagen.");
    return;
  }

  // Validación tamaño máximo 2 MB
  if (archivo.size > 2 * 1024 * 1024) {
    mostrarError("El archivo no debe superar 2MB.");
    return;
  }

  // Mostrar vista previa local inmediata
  const readerPreview = new FileReader();
  readerPreview.onload = (e) => {
    previewImg.src = e.target.result;
    previewWrapper.classList.remove("oculto");  // asegúrate de usar .oculto no .oculta
  };
  readerPreview.readAsDataURL(archivo);

  // Mostrar loading en botón
  boton.disabled = true;
  boton.textContent = "Subiendo...";

  estadoDiv.textContent = "Subiendo imagen al repositorio...";
  estadoDiv.style.color = "#333";

  try {
    // Convertir a Base64 (sin encabezado)
    const base64 = await convertirArchivoBase64(archivo);

    // Generar nombre de archivo seguro con prefijo img_
    const timestamp = Date.now();
    const nombreArchivo = archivo.name
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "_")
      .replace(/[^\w.\-]/g, "")
      .toLowerCase();
    const nombreFinal = `img_${timestamp}_${nombreArchivo}`;

    // Construir payload para Apps Script
    const payload = {
      accion: "subirImagen",
      nombre: nombreFinal,
      base64: base64,      // compat: frontend
      contenido: base64    // compat: backend
    };

    const respuesta = await fetch(URL_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    let data;
    try {
      data = await respuesta.json();
    } catch {
      const txt = await respuesta.text();
      console.error("Respuesta no JSON:", txt);
      throw new Error("Respuesta no válida del servidor.");
    }

    if (data.ok && data.url) {
      estadoDiv.textContent = "✅ Imagen subida correctamente.";
      estadoDiv.style.color = "green";

      // Poner la URL en el input de imagen
      document.getElementById("imagen-url").value = data.url;

      // actualizar preview a la URL real de GitHub (por si recargas)
      previewImg.src = data.url;
      previewWrapper.classList.remove("oculto");
    } else {
      console.error("Respuesta Apps Script:", data);
      estadoDiv.textContent = "❌ Error al subir la imagen: " + (data.error || "");
      estadoDiv.style.color = "red";
    }
  } catch (error) {
    console.error(error);
    estadoDiv.textContent = "❌ Error en el proceso de subida.";
    estadoDiv.style.color = "red";
  } finally {
    boton.disabled = false;
    boton.textContent = "Subir Imagen";
  }
}


function convertirArchivoBase64(archivo) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(",")[1]; // quitar encabezado data:
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(archivo);
  });
}


document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("claveValida") === "true") {
    mostrarAdmin();
  }
});
